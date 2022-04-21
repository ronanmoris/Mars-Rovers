require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const path = require('path')

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname, '../public')))

const customFetch = async (url) => {
    try {
        const data = await fetch(url).then(res => res.json())
        return data
    } catch (error) {
        console.error('error: ', error)
    }
}

app.get('/:name', async (req, res) => {
    const { name } = req.params
    const data = await customFetch(`https://api.nasa.gov/mars-photos/api/v1/manifests/${name}/?max_date=2022-03-05&api_key=${process.env.API_KEY}`)
    res.send(data)
})

app.get('/rover-images/:name/:date', async (req, res) => {
    const { date, name } = req.params
    const { photos } = await customFetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${name}/photos?earth_date=${date}&api_key=${process.env.API_KEY}`)

    res.send(photos)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
