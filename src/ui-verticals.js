export function initVerticals(){
  const v = document.getElementById('verticals');
  if (!v) return;

  function setOpen(isOpen){
    v.classList.toggle('is-open', isOpen);
    v.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }
  function isOpen(){ return v.classList.contains('is-open'); }

  v.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(!isOpen());
  });

  document.addEventListener('click', (e) => {
    if (!v.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  v.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', ()=> setOpen(false));
  });
}
