function serviceError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw serviceError(503, "A dependent service is unavailable");
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const statusCode = [400, 404, 409].includes(response.status) ? response.status : 502;
    throw serviceError(statusCode, body.message || "A dependent service returned an error");
  }
  return body;
}

export async function getCart(accessToken) {
  const baseUrl = process.env.CART_SERVICE_URL.replace(/\/$/, "");
  return requestJson(`${baseUrl}/api/cart`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function getProduct(productId) {
  const baseUrl = process.env.PRODUCT_SERVICE_URL.replace(/\/$/, "");
  const result = await requestJson(`${baseUrl}/api/products/${productId}`);
  if (!result.product) throw serviceError(502, "Product service returned an invalid response");
  return result.product;
}

export async function adjustProductStock(productId, quantity, direction) {
  const baseUrl = process.env.PRODUCT_SERVICE_URL.replace(/\/$/, "");
  const result = await requestJson(`${baseUrl}/api/products/internal/${productId}/stock`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-internal-service-token": process.env.INTERNAL_SERVICE_TOKEN,
    },
    body: JSON.stringify({ quantity, direction }),
  });
  return result;
}

export async function clearCart(accessToken) {
  const baseUrl = process.env.CART_SERVICE_URL.replace(/\/$/, "");
  return requestJson(`${baseUrl}/api/cart`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
