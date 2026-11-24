function serviceError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function getProduct(productId) {
  const baseUrl = process.env.PRODUCT_SERVICE_URL?.replace(/\/$/, "");
  if (!baseUrl) throw serviceError(503, "Product service URL is not configured");

  let response;
  try {
    response = await fetch(`${baseUrl}/api/products/${productId}`);
  } catch {
    throw serviceError(503, "Product service is unavailable");
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) throw serviceError(404, "Product not found or inactive");
    throw serviceError(502, result.message || "Could not validate product with Product service");
  }
  if (!result.product) throw serviceError(502, "Product service returned an invalid response");
  return result.product;
}
