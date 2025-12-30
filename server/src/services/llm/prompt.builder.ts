import { getMessages } from "../../repositories/message.repo";

// FAQ/Domain Knowledge for the fictional e-commerce store
const STORE_KNOWLEDGE = `
═══════════════════════════════════════════════════════════════
                    STORE INFORMATION & POLICIES
═══════════════════════════════════════════════════════════════

📦 **SHIPPING POLICY**
   ────────────────────────────────────────────────────────────
   • Shipping Locations:
     - All 50 US states
     - Canada
     - Mexico
   
   • Shipping Options & Pricing:
     - Standard Shipping: 5-7 business days ($5.99)
     - Express Shipping: 2-3 business days ($12.99)
     - Overnight Shipping: Next business day ($24.99)
   
   • Special Offers:
     - FREE shipping on orders over $50
     - International shipping available (rates vary by country)

🔄 **RETURN & REFUND POLICY**
   ────────────────────────────────────────────────────────────
   • Return Window:
     - 30 days from delivery date
     - Items must be unused, in original packaging with tags attached
   
   • Refund Processing:
     - Refunds processed within 5-7 business days after we receive the item
     - Return shipping is FREE for defective items
   
   • Store Credit:
     - Available for items returned after 30 days (within 60 days)

🕐 **SUPPORT HOURS**
   ────────────────────────────────────────────────────────────
   • Business Hours:
     - Monday - Friday: 9:00 AM - 6:00 PM EST
     - Saturday: 10:00 AM - 4:00 PM EST
     - Sunday: Closed
   
   • Contact Methods:
     - Email: support@spurnow.com (response within 24 hours)
     - Live Chat: Available during support hours

💳 **PAYMENT OPTIONS**
   ────────────────────────────────────────────────────────────
   • Accepted Payment Methods:
     - Credit/Debit Cards (Visa, Mastercard, Amex, Discover)
     - PayPal
     - Apple Pay
     - Google Pay
     - Buy Now, Pay Later (Klarna, Afterpay)

📦 **PRODUCT INFORMATION**
   ────────────────────────────────────────────────────────────
   • Warranty:
     - All products include a 1-year manufacturer warranty
   
   • Product Details:
     - Detailed product descriptions available on each product page
     - Sizing guides available
     - Customer reviews and ratings available for all products

📮 **ORDER TRACKING**
   ────────────────────────────────────────────────────────────
   • Tracking Information:
     - Tracking number sent via email once order ships
     - Track your order on our website or via carrier's website
     - Estimated delivery dates provided at checkout

═══════════════════════════════════════════════════════════════

**IMPORTANT INSTRUCTIONS:**
- Answer customer questions clearly and concisely based on the information above
- Use the exact details provided when answering questions
- If asked about something not covered here, politely let them know you'll need to check with the team
- Suggest they contact support@store.com for detailed assistance on complex matters
- Be friendly, professional, and solution-oriented
`;

export async function buildPrompt(
  conversationId: string,
  userMessage: string,
  ragContext: string
): Promise<Array<{ role: "system" | "user" | "assistant"; content: string }>> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

  // Build system message with store knowledge and optional RAG context
  let systemContent = `You are a helpful and friendly customer support agent for a small e-commerce store. Answer customer questions clearly and concisely. Be professional, empathetic, and solution-oriented.

IMPORTANT: Respond ONLY with your direct answer to the customer. Do NOT include any reasoning, thinking process, or internal notes. Do NOT use tags like <think>, <reasoning>, or <think>. Just provide your response directly.

${STORE_KNOWLEDGE}`;
  
  if (ragContext) {
    systemContent += `\n\nADDITIONAL CONTEXT:\n${ragContext}\n\nUse this additional context if relevant, but prioritize the store policies above.`;
  }

    messages.push({
      role: "system",
    content: systemContent
    });

  // Get conversation history (limit to last 20 messages for context)
  const history = await getMessages(conversationId, 20);
  
  // Add history messages (excluding the current user message)
  for (const msg of history) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      });
    }
  }

  // Add current user message
  messages.push({
    role: "user",
    content: userMessage
  });

  return messages;
}
