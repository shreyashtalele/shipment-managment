export async function getAccessToken(): Promise<string> {
  return localStorage.getItem("access_token") || "";
}
