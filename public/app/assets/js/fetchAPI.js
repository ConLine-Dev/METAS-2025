async function makeRequest(url, method = 'GET', body = null, skipCheckLogin = false) {
  if (!skipCheckLogin) {
    await checkLogin();
    alterPictureAndName()
  }

  const options = {
    method,
    headers: {}
  };

  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = StorageGoogleData ? JSON.parse(StorageGoogleData) : null;

  if (StorageGoogle) {
    options.headers['x-user'] = JSON.stringify(StorageGoogle);
  }

  if (body) {
    if (method === 'GET') {
      console.warn('GET request does not support a request body.');
    } else if (body instanceof FormData) {
      options.body = body;
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro na solicitação ao servidor.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
};

// Verifica se o usuario está logado e retorna as informações do mesmo
async function checkLogin() {
  const localData = localStorage.getItem('StorageGoogle');

  const currentPath = window.location.pathname;
  const isLoginPage = currentPath === '/app/login';

  // Permitir que a autenticação inicial configure o localStorage
  if (!localData) {
    if (!isLoginPage) {
      window.location.href = `/app/login`;
    }
    return false;
  }

  try {
    const parsedData = JSON.parse(localData);

    const getAccess = await makeRequest('/api/users/ListUserByEmailAndPassword','POST', { email: parsedData.email }, true /* Evita a chamada recursiva */);

    if (getAccess && getAccess.length > 0) {
      return true;
    } else {
      throw new Error('Usuário não encontrado.');
    }
  } catch (error) {
    console.error('Erro ao verificar login:', error);
    localStorage.removeItem('StorageGoogle');
    if (!isLoginPage) {
      window.location.href = `/app/login`;
    }
    return false;
  }
};

function alterPictureAndName() {
  const getLocal = localStorage.getItem('StorageGoogle');
  const JSONLocal = JSON.parse(getLocal);

  const userPhoto = document.getElementById('userPhoto');
  userPhoto.setAttribute('src', `https://cdn.conlinebr.com.br/colaboradores/${JSONLocal.system_id_headcargo}`)  

  const userName = document.getElementById('userName');
  userName.textContent = `${JSONLocal.system_username} ${JSONLocal.system_familyName}`
};