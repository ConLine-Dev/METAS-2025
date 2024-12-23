async function handleCredentialResponse(response) {
   try {
      const data = jwt_decode(response.credential);
      console.log('Dados decodificados do Google:', data);
   
      if (data.email_verified) {
         const system = await makeRequest('/api/users/ListUserByEmail', 'POST', { email: data.email }, true /* Ignorar checkLogin para evitar conflitos */);
   
         const mergedData = Object.assign({}, system[0], data);

         // Salva os dados no localStorage
         localStorage.setItem('StorageGoogle', JSON.stringify(mergedData));
   
         // Redireciona diretamente sem chamar checkLogin
         window.location.href = `/app/financeiro/ITJ`;
      } else {
      console.error('Email não verificado.');
      }
   } catch (error) {
     console.error('Erro ao processar a resposta de autenticação:', error);
   }
};

window.onload = function () {
   // Inicia as configurações do login
   google.accounts.id.initialize({
      client_id: "102535144641-anjbob4pgiro4ocq6v7ke68j5cghbdrd.apps.googleusercontent.com",
      callback: handleCredentialResponse
   });

   google.accounts.id.renderButton(
      document.getElementById("buttonDiv"),
      { theme: "outline", size: "large" }  // customization attributes
   );   
};