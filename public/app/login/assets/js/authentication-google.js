async function handleCredentialResponse(response) {
   try {
      const data = jwt_decode(response.credential);
   
      if (data.email_verified) {
         document.getElementById('loader2').classList.remove('d-none'); // remove o d-none para apresentar o loading

         const system = await makeRequest('/api/users/ListUserByEmail', 'POST', { email: data.email }, true /* Ignorar checkLogin para evitar conflitos */);
         
         const mergedData = Object.assign({}, system[0]);
         
         // Salva os dados no localStorage
         localStorage.setItem('hash', JSON.stringify(mergedData));
         
         // Redireciona diretamente sem chamar checkLogin
         const getCompanieId = await makeRequest('/api/users/getCompanieId', 'POST', { email: data.email }, true /* Ignorar checkLogin para evitar conflitos */);
         // O Id da empresa é o mesmo do headcargo.
         if (getCompanieId[0].companie_id_headcargo === 1 /* ITJ */) {
            window.location.href = `/app/financeiro/ITJ`;
         } else if (getCompanieId[0].companie_id_headcargo === 4 /* SP */) {
            window.location.href = `/app/financeiro/SP`;
         } else if (getCompanieId[0].companie_id_headcargo === 7 /* ADM */) {
            window.location.href = '/app/financeiro/ADM'
         } else if (getCompanieId[0].companie_id_headcargo === 8 /* TV */) {
            window.location.href = '/app/financeiro/TV'
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

// Verifica se existe o hash no localstorage e redireciona para a tela correspondente a filial
async function checkLocal (hash) {
   const getCompanieId = await makeRequest('/api/users/listDataUser', 'POST', { hash: hash }); // Dados de recebimento do ano atual

   if (getCompanieId[0].companie_id_headcargo === 7 /* ADM */) {
      window.location.href = `/app/financeiro/ADM`;
   } else if (getCompanieId[0].companie_id_headcargo === 1 /* ITJ */) {
      window.location.href = `/app/financeiro/ITJ`;
   } else if (getCompanieId[0].companie_id_headcargo === 4 /* SP */) {
      window.location.href = `/app/financeiro/SP`;
   } else if (getCompanieId[0].companie_id_headcargo === 8 /* TV */) {
      window.location.href = `/app/financeiro/TV`;
   };
}

window.onload = async function () {
   if (localStorage.getItem('hash')) {
      const getLocalStorage = localStorage.getItem('hash');
      const dataLocal = JSON.parse(getLocalStorage);
   
      await checkLocal(dataLocal.hash_code);
   }

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