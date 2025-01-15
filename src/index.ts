import { main as detectLanguage } from "./main";

detectLanguage().then((result) => {
  console.log(result);
}).catch((error) => {
  console.error(error);
});
