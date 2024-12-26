async function handleCredentialResponse(response) {
   try {
      const data = jwt_decode(response.credential);
   
      if (data.email_verified) {
         document.getElementById('loader2').classList.remove('d-none'); // remove o d-none para apresentar o loading

         const system = await makeRequest('/api/users/ListUserByEmail', 'POST', { email: data.email }, true /* Ignorar checkLogin para evitar conflitos */);
   
         const mergedData = Object.assign({}, system[0], data);

         // Salva os dados no localStorage
         localStorage.setItem('StorageGoogle', JSON.stringify(mergedData));
         
         // Redireciona diretamente sem chamar checkLogin
         if (mergedData.companie_id === 1 /* ITJ */) {
            window.location.href = `/app/financeiro/ITJ`;
         } else if (mergedData.companie_id === 2 /* SP */) {
            window.location.href = `/app/financeiro/SP`;
         } else if (mergedData.companie_id === 4 /* ADM */) {
            window.location.href = '/app/financeiro/ADM'
         } else {
            window.location.href = `/app/financeiro/ITJ`;
         }

      } else {
         document.getElementById('loader2').classList.add('d-none'); // remove o d-none para apresentar o loading
         console.error('Email não verificado.');
      }
   } catch (error) {
      document.getElementById('loader2').classList.add('d-none'); // remove o d-none para apresentar o loading
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