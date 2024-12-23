async function makeRequest(url, method = 'GET', body = null) {
  await checkLogin();

  const options = {
    method,
    headers: {}
  };

  // Obtendo os dados do usuário do localStorage
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = StorageGoogleData ? JSON.parse(StorageGoogleData) : null;

  // Se existir, adicione os dados do usuário no cabeçalho
  if (StorageGoogle) {
    options.headers['x-user'] = JSON.stringify(StorageGoogle);
  }

  if (body) {
    if (method === 'GET') {
      console.warn('GET request does not support a request body.');
    } else {
      // Se body for uma instância de FormData, não defina o Content-Type
      if (body instanceof FormData) {
        options.body = body;
        // O fetch automaticamente definirá o Content-Type como multipart/form-data
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }
    }
  }

  try {
    const response = await fetch(url, options);

    // Verifica se a resposta é um status de sucesso (2xx)
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro na solicitação ao servidor.');
    }

    // Se a resposta for bem-sucedida, retorna os dados
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Verifica se o usuario está logado e retorna as informações do mesmo
async function checkLogin() {
  const localData = localStorage.getItem('StorageGoogle');

  // Verifica se já está na página de login
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath === '/app/login';

  if (!localData) {
    localStorage.removeItem('StorageGoogle');
    // Redireciona somente se não estiver na página de login
    if (!isLoginPage) {
      window.location.href = `/app/login`;
    }
    return; // Interrompe a execução
  }

  try {
    const parsedData = JSON.parse(localData);

    // Verifica se o email é válido no sistema
    const getAccess = await makeRequest('/api/users/ListUserByEmailAndPassword', 'POST', { email: parsedData.email });
    return getAccess;
  } catch (error) {
    console.error('Erro ao verificar login:', error);
    localStorage.removeItem('StorageGoogle');

    // Redireciona somente se não estiver na página de login
    if (!isLoginPage) {
      window.location.href = `/app/login`;
    }
    return; // Interrompe a execução
  }
}