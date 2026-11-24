function serviceError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function ensureProductExists(productId) {
  const baseUrl = process.env.PRODUCT_SERVICE_URL?.replace(/\/$/, "");
  if (!baseUrl) throw serviceError(503, "Product service URL is not configured");

  let response;
  try {
    response = await fetch(`${baseUrl}/api/products/${productId}`, {
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw serviceError(503, "Product service is unavailable");
  }
  const body = await response.json().catch(() => ({}));
  if (response.status === 404) throw serviceError(404, "Product not found or inactive");
  if (!response.ok) throw serviceError(502, body.message || "Could not validate product");
  if (!body.product) throw serviceError(502, "Product service returned an invalid response");
  return body.product;
}
