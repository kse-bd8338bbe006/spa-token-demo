import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://keycloak.192.168.50.10.nip.io",
  realm: "api-security",
  clientId: "spa-token-demo",
});

export default keycloak;
