async function introMain(path) {
    await intro(path);
  }
  
  // Função para verificar se um elemento existe no corpo do site
  function elementExists(selector) {
    return document.querySelector(selector) !== null;
  }
  
  async function intro(path) {
    const data = await makeRequest(path || '../../assets/libs/intro.js/intro.json', 'GET')
    
    
      // Filtra o array, mantendo apenas os elementos encontrados na página
      const filteredArray = data.filter(item => {
        if (item.element) {
            return elementExists(item.element);
        }
        return true; // Se não há propriedade 'element', mantém o item
    });
  
    //INICIA O TUTORIAL COM INTROJS
    introJs()
      .setOptions({
        steps: filteredArray,
        dontShowAgain: true, 
        showProgress: true,
        showBullets: false
      })
      .start();
  }
  
  async function deleteCookie() {
    document.cookie = 'introjs-dontShowAgain=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  };
  
  const btn_tutorial = document.getElementById('btn-tutorial')

  if (btn_tutorial) {
    btn_tutorial.addEventListener('click', async function () {
      await deleteCookie()
      await introMain()
    })
  }
  
  
  