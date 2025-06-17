const client = supabase.createClient(
  'https://kspvsaxelbffptgwripg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcHZzYXhlbGJmZnB0Z3dyaXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzUwNzIsImV4cCI6MjA2NTc1MTA3Mn0.4MpFTzx7aRLUlUdCghG8DSf9aOk14lmCg-xwx-5u4_Q'
);

const cardsContainer = document.getElementById('cards');
const form = document.getElementById('form');
const iframe = document.getElementById('map');
const sidebar = document.getElementById('sidebar');
const title = document.querySelector('#sidebar h2');

const subtitle = document.createElement('h4');
subtitle.textContent = 'Human stories around landslides';
subtitle.style.color = 'var(--subtle)';
subtitle.style.fontWeight = '400';
subtitle.style.marginTop = '0.5rem';

title.insertAdjacentElement('afterend', subtitle);

async function loadStories() {
  const { data, error } = await client
    .from('stories')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error loading stories:', error);
    return;
  }

  cardsContainer.innerHTML = '';
  data.forEach(story => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <strong>${story.headline}</strong><br/>
      <small>${story.date}</small><br/>
      <p>${story.snippet}</p>
      <a href="${story.link}" target="_blank">Read more →</a>
    `;
    card.addEventListener('click', () => {
      highlightCountryOnMap(story.country);
    });
    cardsContainer.appendChild(card);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  const { error } = await client.from('stories').insert([data]);
  if (error) {
    console.error("Insert error:", error);
    alert('Error submitting story');
  } else {
    form.reset();
    loadStories();
  }
});

function highlightCountryOnMap(countryName) {
  iframe.contentWindow.postMessage({ highlight: countryName }, '*');
}

loadStories();
