const { Map, List} = Immutable;

const PHOTOS_KEY = 'Most recent photos';

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

const FilterButton = info => `<button class="btn ${info.selected ? "selected" : ""}" type="button" value="${info.label}">${info.label}</button>`

// higher order function to handle the infos
const withInfos = fn => {
    const infos = store.get('infos');

    const mappedInfos = infos.map(info => FilterButton(info)).join('')

    return fn(mappedInfos)
}

const renderFilterButtonsList = infos => {
    return `
        <section class="info-buttons-section">
            <h2>Select Filters<h2>
            <div class="buttons-list">
                ${infos}
            </div>
        </section>      
    `;
}

const RoverCard = ({ image, name }) => {
    return `
        <button class="rover-card" value=${name}>
            <figure>
                <img src=${image} alt="${name} mars rover"/>
                <figcaption>${name}</figcaption>
            </figure>
        </button>
    `;
}

// higher order function that handles the rover cards
const withRoverCardsList = fn => {
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
    
    const roverCardsList = rovers.map(rover => RoverCard(rover)).join('')

    return fn(roverCardsList)
}

const renderRoverCardsList = (roverCardList) => {
    return `
        <section class="rover-card-section">
            <h2>Rover Cards</h2>
            <p>Click on the cards to see the respective rover data</p>
            <div class="rovers-list">
                ${roverCardList}
            </div>
        </section>
    `;
}

const InfoCard = ({ title, value }) => {
    return `
        <div class="info-card">
            <h3>${title}</h3>
            <div>${value}</div>
        </div>
    `;
}


const InfoCardsList = rovers => {
    return `
        <div class="info-cards-list">
            ${rovers.map(rover => InfoCard(rover)).join('')}
        </div>    
    `;
}



const withSelectedInfos = (fn, infos, roverData) => {
    const selectedInfos = formatRoverInfo(infos, roverData).filter(rover => rover.selected);

    return fn(selectedInfos)
}

const getCardList = selectedInfo => {
    const cardsInfo = selectedInfo.filter(rover => rover.title !== PHOTOS_KEY);
    const cardList = InfoCardsList(cardsInfo)

    return cardList
}

const getImageList = photos => selectedInfo => {
    const isPhotosSelected = selectedInfo.some(info => info.title === PHOTOS_KEY);
    const imageList = isPhotosSelected && RoverImagesList(photos);

    return imageList;
}

const renderInfoSection = (cardList, imageList) => {  
    return `
        <section class="rover-data">
            ${cardList || ''}
            ${imageList || ''}
        </section>
    `;
}

const withInfoSection = (fn, cardList, imageList) => {
    return fn(cardList, imageList);
}

const RoverImagesList = images => {
   return images ? `
        <div class="images-list">
            ${images.map(image => `<img src=${image.img_src} alt="Rover Photo" />`).join('')}
        </div>
    ` : 
    `
        <div>
            Loading...
        </div>
        `;
}

// add our markup to the page
const root = document.getElementById('root');

// immutable store updater
const updateStore = (state, newState) => {
    store = state.merge(newState);
    render(root, store);
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

    const cardList = data && withSelectedInfos(getCardList, infos, data.photo_manifest)
    const imageList = data && withSelectedInfos(getImageList(photos), infos, data.photo_manifest)

    const infoSection = cardList || imageList ? withInfoSection(renderInfoSection, cardList, imageList) : ''
    const roverCardsList = withRoverCardsList(renderRoverCardsList)
    const filterButtonsList = withInfos(renderFilterButtonsList)

    return `
        <header>
            <h1>Mars Rovers Dashboard</h1>
        </header>
            ${filterButtonsList}
            ${roverCardsList}
            ${infoSection}
    `;
}

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    render(root, store);
})
