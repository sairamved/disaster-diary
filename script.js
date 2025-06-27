const client = supabase.createClient(
  'https://kspvsaxelbffptgwripg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcHZzYXhlbGJmZnB0Z3dyaXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzUwNzIsImV4cCI6MjA2NTc1MTA3Mn0.4MpFTzx7aRLUlUdCghG8DSf9aOk14lmCg-xwx-5u4_Q'
);

// Replace with your Mapbox token
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2FpcmFtdmVkIiwiYSI6ImNtOXFma2h3eTFvNDAyaXB0bXZ4aWl0cTcifQ.4Qux75iV9pp_giQu5rwvRQ'; // You'll need to replace this with your token

const cardsContainer = document.getElementById('cards');
const form = document.getElementById('form');
const sidebar = document.getElementById('sidebar');
const title = document.querySelector('#sidebar h2');

// Map variables
let deckgl;
let countryData = [];
let highlightedCountry = null;
let stories = [];

const subtitle = document.createElement('h4');
subtitle.textContent = 'Human stories around landslides';
subtitle.style.color = 'var(--subtle)';
subtitle.style.fontWeight = '400';
subtitle.style.marginTop = '0.5rem';

title.insertAdjacentElement('afterend', subtitle);

// Initialize Deck.gl map
async function initializeMap() {
  // Load world countries data from Natural Earth
  try {
    const response = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
    countryData = await response.json();
  } catch (error) {
    console.error('Error loading country data:', error);
    return; // Stop initialization if data fails to load
  }

  deckgl = new deck.DeckGL({
    container: 'map',
    mapStyle: 'mapbox://styles/mapbox/dark-v10',
    mapboxApiAccessToken: MAPBOX_ACCESS_TOKEN,
    initialViewState: {
      longitude: 0,
      latitude: 20,
      zoom: 2,
      pitch: 0,
      bearing: 0
    },
    controller: true,
    layers: [
      createCountryLayer()
    ]
  });
}

// Create country layer with highlighting
function createCountryLayer() {
  return new deck.GeoJsonLayer({
    id: 'countries',
    data: countryData,
    filled: true,
    stroked: true,
    getFillColor: (d) => {
      const countryName = d.properties?.NAME || d.properties?.name || d.properties?.ADMIN || '';
      if (highlightedCountry && 
          countryName.toLowerCase() === highlightedCountry.toLowerCase()) {
        return [255, 165, 0, 150]; // Orange highlight
      }
      return [60, 60, 60, 80]; // Dark gray default
    },
    updateTriggers: {
      getFillColor: [highlightedCountry]
    },
    getLineColor: [100, 100, 100, 200],
    getLineWidth: 1,
    pickable: true,
    onHover: ({object, x, y}) => {
      if (object) {
        const countryName = object.properties?.NAME || object.properties?.name || object.properties?.ADMIN || '';
        console.log(`Hovered over country: ${countryName}`);
      }
    }
  });
}

// Update map layers
function updateMapLayers() {
  if (deckgl) {
    console.log('Updating map layers with highlighted country:', highlightedCountry);
    deckgl.setProps({
      layers: [createCountryLayer()]
    });
  }
}

// Highlight country on map
function highlightCountryOnMap(countryName) {
  highlightedCountry = countryName;
  updateMapLayers();
}

// Clear country highlight
function clearCountryHighlight() {
  highlightedCountry = null;
  updateMapLayers();
}

async function loadStories() {
  const { data, error } = await client
    .from('stories')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error loading stories:', error);
    return;
  }

  stories = data;
  cardsContainer.innerHTML = '';
  
  data.forEach(story => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <strong>${story.headline}</strong><br/>
      <small>${story.date} • ${story.country}</small><br/>
      <p>${story.snippet}</p>
      <a href="${story.link}" target="_blank">Read more →</a>
    `;
    
    // Add hover events for country highlighting
    card.addEventListener('mouseenter', () => {
      console.log(`Hovering over card: ${story.country}`);
      highlightCountryOnMap(story.country);
      console.log(`Highlighted country: ${highlightedCountry}`);
    });
    
    card.addEventListener('mouseleave', () => {
      console.log(`Stopped hovering over card: ${story.country}`);
      clearCountryHighlight();
      console.log(`Highlighted country cleared: ${highlightedCountry}`);
    });
    
    card.addEventListener('click', () => {
      console.log(`Card clicked: ${story.country}`);
      highlightCountryOnMap(story.country);
      console.log(`Highlighted country: ${highlightedCountry}`);
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

// Initialize the application
async function init() {
  await initializeMap();
  await loadStories();
}

// // Start the application
// init();
// init();
init();
