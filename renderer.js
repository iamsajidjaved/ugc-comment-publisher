document.getElementById('comment-form').addEventListener('submit', (event) => {
  event.preventDefault();

  const urls = document.getElementById('urls').value;
  const author = document.getElementById('author').value;
  const targetSites = document.getElementById('target-sites').value;
  const comments = document.getElementById('comments').value;
  const include404 = document.getElementById('include-404').checked;

  window.electronAPI.submitForm({
    urls,
    author,
    targetSites,
    comments,
    include404
  });
});

window.electronAPI.onFormResult((data) => {
  document.getElementById('result').textContent = data;
});