import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "https://keycloak.192.168.50.10.nip.io",
  realm: "torinks-lab",
  clientId: "notes-spa",
});

export default keycloak;
