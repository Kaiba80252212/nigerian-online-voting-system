export function getAdminToken(): string | null {
  return sessionStorage.getItem("adminToken");
}

export function setAdminToken(token: string) {
  sessionStorage.setItem("adminToken", token);
}

export function clearAdminToken() {
  sessionStorage.removeItem("adminToken");
}

export function isAdminLoggedIn(): boolean {
  return !!getAdminToken();
}

export function getVoterToken(): string | null {
  return sessionStorage.getItem("voterToken");
}

export function setVoterToken(token: string) {
  sessionStorage.setItem("voterToken", token);
}

export function clearVoterToken() {
  sessionStorage.removeItem("voterToken");
}
