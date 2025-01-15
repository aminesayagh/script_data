import { main as detectLanguage } from "./main";

detectLanguage().then().catch((error) => {
  console.error(error);
});
