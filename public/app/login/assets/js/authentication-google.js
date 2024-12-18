const urlHome = '/app/searchApp'
const urlLogin = '/app/login'

async function handleCredentialResponse(response) {
   const data = jwt_decode(response.credential);
   if(data.email_verified) {

      const system = await makeRequest('/api/users/ListUserByEmail', 'POST', {body:data.email})
      console.log(system);
      
      // Juntando os dois arrays
      const mergedData = Object.assign({}, system[0], data);
 
      localStorage.setItem('StorageGoogle', JSON.stringify(mergedData));
      // window.location.href = urlHome // Redireciona para a pagina home
   }
}
window.onload = function () {
   // Inicia as configurações do login
   google.accounts.id.initialize({
      client_id: "102535144641-anjbob4pgiro4ocq6v7ke68j5cghbdrd.apps.googleusercontent.com",
      callback: handleCredentialResponse
   });

   // 
   google.accounts.id.renderButton(
      document.getElementById("buttonDiv"),
      { theme: "outline", size: "large" }  // customization attributes
   );
   // google.accounts.id.prompt(); // also display the One Tap dialog

   // Verifica o localStorage para alterar a mensagem de boas vindas
   const StorageGoogleData = localStorage.getItem('StorageGoogle');
   const StorageGoogle = JSON.parse(StorageGoogleData);

   checkLoginExpiration();

   setInterval(async () => {
      checkLoginExpiration()
   }, 1000);
}

// Função para verificar se o tempo de login expirou
function checkLoginExpiration() {

   if(localStorage.getItem('StorageGoogle')) {
      // window.location.href = urlHome
   }


   const loginTime = localStorage.getItem('loginTime');

   if (loginTime) {
      const currentTime = new Date().getTime();
      const elapsedTime = currentTime - parseInt(loginTime);

      // 24 horas em milissegundos
      const twentyFourHours = 1000;
      console.log(elapsedTime >= twentyFourHours)
      if (elapsedTime >= twentyFourHours) {
         // Limpa os dados do usuário e redireciona para a página de login
         localStorage.removeItem('StorageGoogle');
         localStorage.removeItem('loginTime');
         window.location.href = urlLogin
      }
   }
}