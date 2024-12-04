const express = require('express');
const app = express();


app.use(express.json());

app.get('/',(req,res)=>{
    res.send("exelon_api");
})

var cityData = [
{ id: 0, name: 'dubai', population: 1000, country: 'UAE', latitude: 10.12, longitude: 12 },
{ id: 1, name: 'florida', population: 1004, country: 'USA', latitude: 34.2, longitude: 3421 },
{ id: 2, name: 'london', population: 1101, country: 'UK', latitude: 51.112, longitude: 123 },
{ id: 3, name: 'bangalore', population: 2001, country: 'India', latitude: 48.21, longitude: 2.1 },
{ id: 4, name: 'delhi', population: 1021, country: 'India', latitude: 35.1, longitude: 139.012 },
{ id: 5, name: 'moscow', population: 900, country: 'Russia', latitude: 52.122, longitude: 13.121 }
]


app.post('/addCity', (req, res) => {
    const receivedCityData = req.body;

    const requiredFields = ['name', 'population', 'country', 'latitude', 'longitude'];
    for (let i=0;i<requiredFields.length;i++) {
        if (receivedCityData[ requiredFields[i] ] == null) {
            return res.status(400).json({ error: `missing field: ${requiredFields[i]}` });
        }
    }

    //checking uniqueness
    for (let i=0;i<cityData.length;i++) {
        if (receivedCityData["name"] == cityData[i]["name"]) {
            return res.status(400).json({ error: `city exists!` });
        }
    }

    const cityWithID = {id : cityData.length,...receivedCityData};

    cityData.push(cityWithID)
    res.status(201).json({ message: 'city added ', city: cityWithID });
});


app.patch('/updateCity/:id', (req, res) => {
    const cityId = parseInt(req.params.id); 
    const updatedData = req.body; 

    const city = cityData.find(city => city.id === cityId);

    if (!city) {
        return res.status(404).json({ error: 'city not found' });
    }

    for (const key in updatedData) {
        city[key] = updatedData[key];         
    }

    res.status(200).json({ message: 'City updated successfully', city: city });
});


app.delete('/deleteCity/:id', (req, res) => {
    const cityId = parseInt(req.params.id); 

    const deleteCity = cityData.find(city => city.id === cityId);

    if (!deleteCity) {
        return res.status(404).json({ error: 'city not found' });
    }
    cityData = cityData.filter((city)=>{
        return city!=deleteCity;
    })
    res.status(200).json({ message: 'City Deleted successfully' });
});


app.get('/getCities', (req, res) => {
 
    let page = parseInt(req.query.page) || 1; 
    let limit = parseInt(req.query.limit) || cityData.length; 

    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;
  
    page = parseInt(page);
    limit = parseInt(limit);

    //limit and page
    let result = cityData.slice(startIndex, endIndex);

    //sort
    if (req.query.sort) {
        const requestSortInfo = req.query.sort.split(':');
        const sortField = requestSortInfo[0];
        const sortOrder = requestSortInfo[1];

        result = result.sort((a, b) => {
          if (sortOrder === 'desc') {
            return b[sortField] - a[sortField];
          }
          else if(sortOrder === 'asc') return a[sortField] - b[sortField];
          else return res.status(400).json({message: "INvalid sorting method"});
        });
    }
    //search
    if (req.query.search) {
        const searchRequire = JSON.parse(req.query.search);
        result = result.filter(city =>{
            for(let key in searchRequire){
                const searchValue = searchRequire[key];
                if(city[key]==searchValue) return true;
                return false;
            }
        });
    }

    //filter

    if (req.query.filter) {
        const filterRequire = JSON.parse(req.query.filter); 
        result = result.filter(city => {
          for (let key in filterRequire) {

            const condition = filterRequire[key];
            
            const operator = condition[0];
            const value = condition.slice(1,condition.length)
            
            console.log(operator)
            const cityValue = city[key];
            if(operator!='>' && operator!='<' && operator!='=' ) res.status(400).json({message: "The operator is invalid"});
            if (operator === '>' && cityValue <= parseInt(value)) return false;
            if (operator === '<' && cityValue >= parseInt(value)) return false;
            if (operator === '=' && cityValue !== value) return false;
          }
          return true;
        });
    }

    //project
    
    if (req.query.projection) {
        const requiredFields = req.query.projection.split(',');  
        let tempResult = [];  
        
        result.forEach(city => {
          let tempObj = {}; 
    
          requiredFields.forEach(field => {
            if (city[field]) {  
              tempObj[field] = city[field];
            }
          });
    
          tempResult.push(tempObj);  
        });
    
        result = tempResult;  
    }

    res.status(200).json(result);
});





app.listen(3000,()=>{
    console.log("server is running at 3000");
})