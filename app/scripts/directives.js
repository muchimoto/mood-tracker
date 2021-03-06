'use strict';
angular.module('Moodtracker.directives', ['d3'])

//Today's Data bar chart directive
.directive('d3Bars', ['$window', '$timeout', 'd3Service',
    function($window, $timeout, d3Service) {
        return {
            restrict: 'A',
            scope: {
                data: '=',
                label: '@',
                onClick: '&'
            },
            link: function(scope, ele, attrs) {

                d3Service.d3().then(function(d3) {

                    var renderTimeout;
                    var margin = parseInt(attrs.margin) || 20,
                        barHeight = parseInt(attrs.barHeight) || 20,
                        barPadding = parseInt(attrs.barPadding) || 5;

                    var svg = d3.select(ele[0])
                        .append('svg')
                        .style('width', '100%');

                    $window.onresize = function() {
                        scope.$apply();
                    };

                    scope.$watch(function() {
                        return angular.element($window)[0].innerWidth;
                    }, function() {
                        scope.render(scope.data);
                    });

                    // watch for data changes and re-render
                    scope.$watch('data', function(newVals, oldVals) {
                        return scope.render(newVals);
                    }, true);

                    scope.render = function(data) {
                        svg.selectAll('*').remove();

                        if (!data) return;
                        if (renderTimeout) clearTimeout(renderTimeout);

                        renderTimeout = $timeout(function() {
                            var width = d3.select(ele[0])[0][0].offsetWidth - margin,
                                height = scope.data.length * (barHeight + barPadding),
                                color = d3.scale.category20(),
                                xScale = d3.scale.linear()
                                .domain([0, d3.max(data, function(d) {
                                    return d.scale;
                                })])
                                .range([0, width]);

                            svg.attr('height', height);

                            svg.selectAll('rect')
                                .data(data)
                                .enter()
                                .append('rect')
                                .on('click', function(d, i) {
                                    return scope.onClick({
                                        item: d
                                    });
                                })
                                .attr('height', barHeight)
                                .attr('width', 140)
                                .attr('x', Math.round(margin / 2))
                                .attr('y', function(d, i) {
                                    return i * (barHeight + barPadding);
                                })
                                .attr('fill', function(d) {
                                    return d.color;
                                })
                                .on('click', function(d, i) {
                                    return scope.onClick({
                                        item: d
                                    });
                                })
                                .transition()
                                .duration(1000)
                                .attr('width', function(d) {
                                    return xScale(d.scale);
                                });
                            svg.selectAll('text')
                                .data(data)
                                .enter()
                                .append('text')
                                .attr('fill', '#fff')
                                .attr('y', function(d, i) {
                                    return i * (barHeight + barPadding) + 15;
                                })
                                .attr('x', 15)
                                .text(function(d) {
                                    return d.name + ": " + d.mood + " (Factor: " + d.scale + ")";
                                });
                        }, 200);
                    };
                });
            }
        }
    }
])

.directive('d3Line', ['$window', '$timeout', 'd3Service',
    function($window, $timeout, d3Service) {
        return {
            restrict: 'A',
            scope: {
                data: '=',
                label: '@',
                onClick: '&'
            },
            link: function(scope, ele, attrs) {

                d3Service.d3().then(function(d3) {

                    var renderTimeout;

                    var margin = {
                            top: 20,
                            right: 20,
                            bottom: 30,
                            left: 50
                        },
                        width = d3.select(ele[0])[0][0].offsetWidth - margin.left - margin.right,
                        height = 500 - margin.top - margin.bottom;

                    var svg = d3.select(ele[0])
                        .append('svg')
                        .attr("width", width + margin.left + margin.right + 'px')
                        .attr("height", height + margin.top + margin.bottom + 'px')
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    var tooltip = d3.select(ele[0]).append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0);

                    $window.onresize = function() {
                        scope.$apply();
                    };

                    scope.$watch(function() {
                        return angular.element($window)[0].innerWidth;
                    }, function() {

                        scope.render(scope.data);
                        // console.log('scope data', scope.data);
                    });

                    // watch for data changes and re-render
                    scope.$watch('data', function(newVals, oldVals) {

                        return scope.render(newVals);

                    }, true);

                    scope.render = function(data) {
                        svg.selectAll('*').remove();

                        if (!data) return;
                        if (renderTimeout) clearTimeout(renderTimeout);

                        renderTimeout = $timeout(function() {

                            if (data) {
                                scope.$evalAsync(function(scope) {
                                    var parseDate = d3.time.format.utc("%a, %d %b %Y %X GMT").parse;
                                    data.forEach(function(d, i) {
                                        d.date = parseDate(d.date);
                                        d.scale = +d.scale;
                                        // console.log('d in directive at index', i, ' is ....', d.date)
                                    });
                                })
                            }
                            width = d3.select(ele[0])[0][0].offsetWidth - margin.left - margin.right;
                            svg.attr("width", width + margin.left + margin.right + 'px');
                           
                            var innerx = d3.scale.linear()
                                .domain([0, width - margin.right])
                                .range([20, width - margin.right]);
                            var innery = d3.scale.linear()
                                .domain([height, margin.top])
                                .range([height - 20, margin.top]);
                            var x = d3.time.scale()
                                .range([0, width - margin.right]);
                            var y = d3.scale.linear()
                                .range([height, margin.top]);
                            var xAxis = d3.svg.axis()
                                .scale(x)
                                .orient("bottom");
                            var yAxis = d3.svg.axis()
                                .scale(y)
                                .orient("left");
                            var line = d3.svg.line()
                                .x(function(d) {
                                    return innerx(x(d.date));
                                })
                                .y(function(d) {
                                    return innery(y(d.scale));
                                })

                            // Interpolation function 
                            function pathTween() {
                                var interpolate = d3.scale.quantile()
                                    .domain([0, 1])
                                    .range(d3.range(1, data.length + 1));
                                return function(t) {
                                    return line(data.slice(0, interpolate(t)));
                                };
                            }


                            x.domain(d3.extent(data, function(d) {
                                return d.date;
                            }));
                            y.domain(d3.extent(data, function(d) {
                                return d.scale;
                            }));

                             //draw line
                            svg.append("path")
                                .datum(data)
                                .attr("class", "line")
                                .attr("d", line)
                                .style("z-index", 0)
                                .transition()
                                .duration(3000)
                                .attrTween('d', pathTween);

                            // setup dot fill color
                            var cValue = function(d) {
                                    return d.mood;
                                },
                                color = d3.scale.category10();

                            // draw dots
                            svg.selectAll(".dot")
                                .data(data)
                                .enter().append("circle")
                            .attr("class", "dot")
                                .attr("r", 9)
                                .attr("cx", function(d) {
                                    return innerx(x(d.date));
                                })
                                .attr("cy", function(d) {
                                    return innery(y(d.scale));
                                })
                                .style("fill", function(d) {
                                    return color(cValue(d));
                                })
                                .on("mouseover", function(d) {
                                    tooltip.transition()
                                        .duration(200)
                                        .style("opacity", 0.9);
                                    tooltip.html(d.mood + "<br/> (" + x(d) + ", " + y(d) + ")")
                                        .style("left", (d3.event.pageX + 5) + "px")
                                        .style("top", (d3.event.pageY - 28) + "px");
                                })
                                .on("mouseout", function(d) {
                                    tooltip.transition()
                                        .duration(500)
                                        .style("opacity", 0);
                                })

                            var t0 = svg.transition().duration(1000);
                            t0.selectAll(".dot").attr("r", 15).style("z-index", 500);


                           


                            // draw legend
                            var legend = svg.selectAll(".legend")
                                .data(color.domain())
                                .enter().append("g")
                                .attr("class", "legend")
                                .attr("transform", function(d, i) {
                                    return "translate(0," + i * 20 + ")";
                                });

                            // draw legend colored rectangles
                            legend.append("rect")
                                .attr("x", width - 18)
                                .attr("width", 18)
                                .attr("height", 18)
                                .style("fill", color);

                            // draw legend text
                            legend.append("text")
                                .attr("x", width - 24)
                                .attr("y", 9)
                                .attr("dy", ".35em")
                                .style("text-anchor", "end")
                                .text(function(d) {
                                    return d;
                                })






                            svg.append("g")
                                .attr("class", "x axis")
                                .attr("transform", "translate(0," + height + ")")
                                .call(xAxis)


                            svg.append("g")
                                .attr("class", "y axis")
                                .call(yAxis)
                                .append("text")
                                .attr("transform", "rotate(-90)")
                                .attr("y", 6)
                                .attr("dy", ".71em")
                                .style("text-anchor", "end")
                                .text("Scale");

                            //END OF RENDER TIMEOUT
                        }, 200);
                    }
                });
            }
        }
    }
])



.directive('twitter', [
    function() {
        return {
            link: function(scope, element, attr) {
                setTimeout(function() {
                    twttr.widgetscreateShareButton(
                        attr.url,
                        element[0],
                        function(el) {}, {
                            count: 'none',
                            text: attr.text
                        }
                    );
                });
            }
        }
    }
]);