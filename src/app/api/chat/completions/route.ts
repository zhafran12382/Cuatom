import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";
import { chatCompletionSchema } from "@/lib/validators";
import { buildEndpointUrl, buildHeaders } from "@/lib/openai-compatible";
import { normalizeProviderError } from "@/lib/errors";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    await ensureDatabase();
    const body = await req.json();
    const parsed = chatCompletionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      conversationId,
      providerId,
      modelId,
      messages,
      saveUserMessage,
      userMessage,
      temperature,
      topP,
      maxTokens,
      stream,
    } = parsed.data;

    // Fetch provider
    const provider = await db.provider.findUnique({ where: { id: providerId } });
    if (!provider) {
      return NextResponse.json({ message: "Provider not found" }, { status: 404 });
    }
    if (!provider.isActive) {
      return NextResponse.json({ message: "Provider is inactive" }, { status: 400 });
    }

    // Enforce limits
    const maxPromptChars = parseInt(process.env.MAX_PROMPT_CHARS || "100000", 10);
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    if (totalChars > maxPromptChars) {
      return NextResponse.json({ message: "Prompt too long" }, { status: 400 });
    }

    const maxOutputTokens = parseInt(process.env.MAX_OUTPUT_TOKENS || "8192", 10);
    const finalMaxTokens = Math.min(maxTokens || 4096, maxOutputTokens);

    const userContentToSave = userMessage?.trim();
    const saveUserMessagePromise =
      saveUserMessage && userContentToSave
        ? db.message
            .create({
              data: {
                conversationId,
                role: "user",
                content: userContentToSave,
              },
            })
            .catch((error) => {
              console.error("Failed to save user message:", error);
              return null;
            })
        : Promise.resolve(null);

    // Build request
    const url = buildEndpointUrl(provider);
    const headers = buildHeaders(provider);
    const timeout = parseInt(process.env.DEFAULT_REQUEST_TIMEOUT_MS || "90000", 10);

    const shouldStream = stream !== false && provider.supportsStreaming;

    const requestBody = {
      model: modelId,
      messages,
      temperature: temperature ?? 0.7,
      top_p: topP ?? 1.0,
      max_tokens: finalMaxTokens,
      stream: shouldStream,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === "AbortError") {
        return NextResponse.json(
          { message: "Request timed out — endpoint unreachable or too slow" },
          { status: 504 }
        );
      }
      const normalized = normalizeProviderError(error);
      return NextResponse.json(
        { message: normalized.message, details: normalized.details },
        { status: 502 }
      );
    }

    // Handle non-OK response
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      let parsed: unknown;
      try { parsed = JSON.parse(errorBody); } catch { parsed = errorBody; }
      const normalized = normalizeProviderError(parsed, response.status);

      // Save error message to DB
      await saveUserMessagePromise;
      await db.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: "",
          providerName: provider.name,
          modelId,
          error: normalized.message,
        },
      });

      return NextResponse.json(
        { message: normalized.message, details: normalized.details },
        { status: response.status }
      );
    }

    // Handle streaming response
    if (shouldStream && response.body) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      let fullContent = "";
      let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          const text = decoder.decode(chunk, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (!line.trim() || line.trim() === "data: [DONE]") {
              if (line.trim() === "data: [DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
              continue;
            }

            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6);
              try {
                const data = JSON.parse(jsonStr);
                const delta = data.choices?.[0]?.delta;
                if (delta?.content) {
                  fullContent += delta.content;
                }
                if (data.usage) {
                  usage = data.usage;
                }
              } catch {
                // Skip invalid JSON chunks
              }
            }

            controller.enqueue(encoder.encode(line + "\n"));
          }
        },
        async flush() {
          // Persist the optimistic user message before the assistant message so
          // history order is correct when the client reconciles after streaming.
          await saveUserMessagePromise;

          // Save complete message to DB
          await db.message.create({
            data: {
              conversationId,
              role: "assistant",
              content: fullContent,
              providerName: provider.name,
              modelId,
              promptTokens: usage.prompt_tokens || null,
              completionTokens: usage.completion_tokens || null,
              totalTokens: usage.total_tokens || null,
            },
          });

          // Update conversation title if first message
          const msgCount = await db.message.count({ where: { conversationId } });
          if (msgCount <= 2) {
            const title = fullContent.slice(0, 50).replace(/\n/g, " ") || "New Chat";
            await db.conversation.update({
              where: { id: conversationId },
              data: { title, updatedAt: new Date() },
            });
          } else {
            await db.conversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            });
          }
        },
      });

      const stream = response.body.pipeThrough(transformStream);

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Handle non-streaming response
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const usage = data.usage || {};

    // Save to DB
    await saveUserMessagePromise;
    await db.message.create({
      data: {
        conversationId,
        role: "assistant",
        content,
        providerName: provider.name,
        modelId,
        promptTokens: usage.prompt_tokens || null,
        completionTokens: usage.completion_tokens || null,
        totalTokens: usage.total_tokens || null,
      },
    });

    // Update conversation
    const msgCount = await db.message.count({ where: { conversationId } });
    if (msgCount <= 2) {
      const title = content.slice(0, 50).replace(/\n/g, " ") || "New Chat";
      await db.conversation.update({
        where: { id: conversationId },
        data: { title, updatedAt: new Date() },
      });
    } else {
      await db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      content,
      usage,
    });
  } catch (error) {
    console.error("Chat completion error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
