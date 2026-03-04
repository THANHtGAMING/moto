 document.querySelectorAll('.show').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = 'hide';
        } else {
          input.type = 'password';
          btn.textContent = 'show';
        }
      });
    });