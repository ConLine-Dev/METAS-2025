const urlHome = '/app/searchApp'

async function handleCredentialResponse(response) {
   try {
      const data = jwt_decode(response.credential);
      if (data.email_verified) {
         // Faz a requisição para verificar o email no sistema
         const system = await makeRequest('/api/users/ListUserByEmailAndPassword', 'POST', { email: data.email });

         // Junta os dados do Google com os dados do sistema
         const mergedData = Object.assign({}, system[0], data);

         // Salva os dados no localStorage
         localStorage.setItem('StorageGoogle', JSON.stringify(mergedData));

         // Redireciona para a página inicial
         window.location.href = urlHome;
      } else {
         console.error('Email não verificado.');
      }
   } catch (error) {
     console.error('Erro ao processar a resposta de autenticação:', error);
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
}