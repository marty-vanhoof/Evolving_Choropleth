// geoData is loaded at the end, and then passed
// to draw() as a callback
function draw(geoData) {
    "use strict";
    // width, height not cross-browser compatible yet
    var width = window.outerWidth,
        height = window.outerHeight - 150;

    d3.select('body')
        .append('h3');

    d3.select('body')
        .append('h2');

    d3.select('body')
        .append('div')
        .attr('id', 'dropdown');

    // div element for the box that holds the data on mouseover
    var tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('z-index', '9999')
        .style('visibility', 'hidden')
        .text('tooltip');

    // create svg canvas and style its border
    var svg = d3.select('body')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'map')
        .style('border', '1px solid black')
        .style('stroke', 'black'); 

    // map (long, lat) coordinates to (x,y) pixels
    var projection = d3.geo.mercator()
        .scale(180) 
        .translate([width * 0.5, height * 0.59]);

    // generate the path data string suitable for the 'd' 
    // attribute of an SVG path element
    var path = d3.geo.path().projection(projection);

    var graticule = d3.geo.graticule();

    // shows the water areas on the map
    var gratBackground = svg.append('path')
        .datum(graticule.outline)
        .attr('class', 'gratBackground')
        .attr('d', path);

    // bind the geographic data to the page, creating new
    // SVG path elements for each country
    var map = svg.selectAll('path')
        .data(geoData.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', 'countries');

    // at the end of use_csvData(), the csv data is loaded and 
    // passed to this function as a callback
    function use_csvData(csvData) {

        var maxSubscriptions = d3.max(csvData, function(d) {
            return d.subscriptions_per100;
        });

        var midSubscriptions = maxSubscriptions * 0.5;

        var c1 = 'white', 
            c2 = 'red';

        // color scale that interpolates between white and red
        var color = d3.scale.pow().exponent(.4)
            .domain([0, midSubscriptions, maxSubscriptions])
            .range([c1, d3.interpolateRgb(c1, c2)(0.5), c2]);

        geoData = linkCsv_to_geoData(csvData, geoData);

        var years = Object.keys(geoData.features[0].properties).slice(0,-1);
        var yearIndex = 0;

        // begin with the initial heading, then transition to the map animation
        d3.select('h2')
            .html('Internet usage throughout the world\
                has increased drastically since 1990')
            .transition().duration(3000)
            .each('end', animate);


        function animate() {
        
            var yearInterval = setInterval(function() {

                // update map every 1 second for each year
                shadeByYear(years[yearIndex]);
                makeLegend();
                yearIndex++

                if (yearIndex >= years.length) {

                    // at the end of the animation, do the other stuff...
                    clearInterval(yearInterval);
                    createDropdown_and_MouseEvents();
                    hoverBlurb();

                    d3.select('body')
                        .append('h4')
                        .html('data source:<br>\
                            <a href="http://www.gapminder.org/data/">\
                            www.gapminder.org/data/</a>');
                }
            }, 1000); 
        }

        function makeLegend() {

            var lg_width = 20, lg_height = 25;

            var lg_colorDomain = [0, 2, 5, 10, 20, 40, 60, 80]

            var legend = svg.selectAll('g.legend')
                .data(lg_colorDomain)
                .enter().append('g')
                .attr('class', 'legend');

            // make the legend bars
            legend.append('rect')
                .attr('x', 80)
                .attr('y', function(d, i) {
                    return height - 30 - i * lg_height - 2 * lg_height;
                }) 
                .attr('width', lg_width)
                .attr('height', lg_height)
                .style('fill', function(d, i) { return color(d); });

            // make the legend labels
            legend.append('text')
                .attr('x', 110)
                .attr('y', function(d, i) {
                    return height - 37 - i * lg_height - lg_height; 
                })
                .text(function(d) { return d; });

        } 

        function hoverBlurb() {

            d3.select('h2')
                .append('p')
                .attr('class', 'p')
                .text('(Hover over each country to see the data, use the dropdown to select the year)');
        }

        function createDropdown_and_MouseEvents() {

            var yearVal = years[years.length - 1];

            // add a select element for the dropdown menu
            var dropdown = d3.select('#dropdown')
                .append('div')
                .attr('class', 'dropdown')
                .html('<h3>Select<br>Year</h3>')
                .append('select')
                .on('change', function() {
                    yearVal = this.value;
                    shadeByYear(this.value);
                    hoverBlurb();
                });

            // create each option element within the dropdown
            dropdown.selectAll('option')
                .data(years)
                .enter().append('option')
                .attr('value', function(d) { return d; })
                .property('selected', function(d) { return d === yearVal; })
                .text(function(d) { return d; });

            // mouseover and mouseout events
            map.on('mouseover', function(d) {
                d3.select(this).transition()
                    .delay(50)
                    .duration(200)
                    .style('stroke', 'black')
                    .style('stroke-width', 2);

                var yearSubVal = Math.round(d.properties[yearVal] * 100) / 100;

                var mouseOver = tooltip.style('visibility', 'visible')
                    .html(d.properties.name + '</br>' + yearVal + '</br>' + yearSubVal)
                    .style('color', 'black')
                    .style('top', (d3.event.layerY) + 'px')
                    .style('left', (d3.event.layerX) + 'px');

                return mouseOver;
            })
               .on('mouseout', function() {
                d3.select(this).transition()
                    .delay(50)
                    .duration(600)
                    .style('stroke', 'grey')
                    .style('stroke-width', 1)

                return tooltip.style('visibility', 'hidden');
            })

        }

        function shadeByYear(year) {

            d3.select('h2')
                .text('Internet Users per hundred people: ' + year)
                .style('opacity', 1);

            // shade the countries according to the data for a particular year
            svg.selectAll('path')
                .transition()
                .duration(500)
                .style('fill', function(d) {
                    if ( d.properties[year] > 0 ) { 
                        return color( d.properties[year] ); 
                    } else if ( d.properties[year] === 0 ) {
                        return 'white';
                    } else {
                        // if the value is undefined, then color it grey
                        return '#ccc';
                    } 
                }); 
        }

        function linkCsv_to_geoData(csvData, geoData) {

            // group csvData by year
            var csvData_byYear = d3.nest()
                .key(function(d) { 
                    return d.year.getUTCFullYear(); 
                })
                .entries(csvData);


            // need to have matching names in both the csv and json files
            geoData.features[167].properties.name = "United States"; 
            geoData.features[57].properties.name = "United Kingdom";

            // loop through csvData_byYear and geoData in order to
            // attach the year and subscriptions data from 
            // csvData_byYear to geoData
            for (var i = 0; i < csvData_byYear.length; i++) {

                // get the year and csvData values by year
                var year = csvData_byYear[i].key;
                var values = csvData_byYear[i].values;

                for (var j = 0; j < values.length; j++) {

                    // for each year get the country and subscriptions
                    var csvCountry = values[j].country;
                    var csvSubs = values[j].subscriptions_per100;

                    for (var k = 0; k < geoData.features.length; k++) {

                        // get the country name from geoData
                        var jsonCountry = geoData.features[k].properties.name;

                        if (jsonCountry == csvCountry) {

                            // if the country name in the geo-json file matches
                            // the country name in the csv file, then make a new
                            // entry in geoData.features[k].properties, where the
                            // key is the year and the value is the subscriptions
                            // data for that year and the given country
                            geoData.features[k].properties[year] = csvSubs;
                        }
                    }
                }
            }
            return geoData;
        }
    }

    var format = d3.time.format("%Y");

    // load the CSV file and pass the data to use_csvData()
    d3.csv('internet_users_per100_tidy.csv', function(d) {
        d['subscriptions_per100'] = +d['subscriptions_per100'];
        d['year'] = format.parse(d['year']);
        return d;
    }, use_csvData);
}

// load the GeoJSON file and pass the data to draw()
d3.json('world_countries.json', draw);