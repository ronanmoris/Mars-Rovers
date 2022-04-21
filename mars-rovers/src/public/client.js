const { Map, List} = Immutable;

let store = Map({
    infos: List([
        { label: 'Launch Date', selected: true, key: 'launch_date' },
        { label: 'Landing Date', selected: true, key: 'landing_date' },
        { label: 'Date photos were taken', selected: false, key: 'max_date' },
        { label: 'Most recent photos', selected: false, key: 'photos' },
        { label: 'Status', selected: false, key: 'status' },
        { label: 'Name', selected: true, key: 'name' },
    ])
})

// utility functions
const fetchRoverDataByName = name => {
    return fetch(`http://localhost:3000/${name}`)
        .then(res => res.json())
        .then(data => {
            updateStore(store, { data })
            return data;
        })
        .catch(error => console.error(error)
    )
}

const fetchRecentRoverPhotos = (date, name) => {
    fetch(`http://localhost:3000/rover-images/${name}/${date}`)
        .then(res => res.json())
        .then(photos => updateStore(store, { photos }))
        .catch(error => console.error(error))
}

const formatDate = date => date.split('-').reverse().join('/')


// fetch most recent rover photos
async function handleRoverClick() {
    const roverName = this.value.toLowerCase();
    const data = await fetchRoverDataByName(roverName);
    const maxDate = data.photo_manifest.max_date

    fetchRecentRoverPhotos(maxDate, roverName);
}

// toggles which filter buttons are selected in the store
function togglefilterSelected() {
    this.classList.toggle('selected');
    const selectedInfoButton = store.get('infos').find(infos => infos.label === this.value);
    selectedInfoButton.selected = !selectedInfoButton.selected
    updateStore(store, selectedInfoButton)
}

// mapper to format the info cards
const formatRoverInfo = (infos, roverData) => {
    return infos.map(({ key, label, selected}) => ({
        title: label,
        value: roverData[key],
        selected: selected,
        })
    )
}

const FilterButton = button => `<button class="btn ${button.selected ? "selected" : ""}" type="button" value="${button.label}">${button.label}</button>`

const FilterButtonsList = buttons => {
    return `
        <section class="info-buttons-section">
            <h2>Select Filters<h2>
            <div class="buttons-list">
                ${buttons.map(button => FilterButton(button)).join('')}
            </div>
        </section>
            
    `
}

function RoverCard ({ image, name }) {
    return `
        <button class="rover-card" value=${name}>
            <figure>
                <img src=${image} alt="${name} mars rover"/>
                <figcaption>${name}</figcaption>
            </figure>
        </button>
    `
}

function RoverCardsList () {
    const rovers = [
        {
            name: 'Curiosity',
            image: './assets/images/mars-rover.jpeg'
        },
        {
            name: 'Opportunity',
            image: './assets/images/mars-rover-opportunity.jpeg'
        },
        {
            name: 'Spirit',
            image: './assets/images/mars-rover-spirit.jpeg'
        }
    ]
    return `
        <section class="rover-card-section">
            <h2>Rover Cards</h2>
            <p>Click on the cards to see the respective rover data</p>
            <div class="rovers-list">
                ${rovers.map(rover => RoverCard(rover)).join('')}
            </div>
        </section>
    `
}

function InfoCard({ title, value }) {
    return `
        <div class="info-card">
            <h3>${title}</h3>
            <div>${value}</div>
        </div>
    `
}

function InfoCardsList(rovers) {
    return `
        <div class="info-cards-list">
            ${rovers.map(rover => InfoCard(rover)).join('')}
        </div>    
    `
}

// wrapper for the information cards section and images
function RoversInfoSection(infos, roverData, photos) {
    const PHOTOS_KEY = 'Most recent photos';
    const selectedInfo = formatRoverInfo(infos, roverData).filter(rover => rover.selected);
    const cardsInfo = selectedInfo.filter(rover => rover.title !== PHOTOS_KEY);
    isPhotosSelected = selectedInfo.some(info => info.title === PHOTOS_KEY)
    
    return `
        <section class="rover-data">
            ${InfoCardsList(cardsInfo)}
            ${isPhotosSelected ? RoverImagesList(photos) : ''}
        </section>
    ` 
}

function RoverImagesList(images) {
   return images ? `
        <div class="images-list">
            ${images.map(image => `<img src=${image.img_src} alt="Rover Photo" />`).join('')}
        </div>
    ` : 
     `
        <div>
            Loading...
        </div>
        `
}

// add our markup to the page
const root = document.getElementById('root')

// immutable store updater
function updateStore(state, newState) {
    store = state.merge(newState)
    render(root, store)
}

const render = (root, state) => {
    root.innerHTML = App(state);

    const filterButtons = document.querySelectorAll('.btn');
    filterButtons.forEach(btn => btn.addEventListener('click', togglefilterSelected));

    const roverCards = document.querySelectorAll('.rover-card');
    roverCards.forEach(card => card.addEventListener('click', handleRoverClick));
}

// create content
const App = (state) => {
    const infos = state.get('infos');
    const data = state.get('data');
    const photos = state.get('photos');

    return `
        <header>
            <h1>Mars Rovers Dashboard</h1>
        </header>
            ${FilterButtonsList(infos)}
            ${RoverCardsList()}
            ${data ? RoversInfoSection(infos, data.photo_manifest, photos) : ''}
    `
}

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    render(root, store);
})
