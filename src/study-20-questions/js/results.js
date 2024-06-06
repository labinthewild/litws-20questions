(function (exports) {

  const renderChart = function (divID, scorePersonal, scoreRelationships) {
    var ctx = document.getElementById(divID).getContext("2d");

    var data = {
        labels: ["You", "United States", "Kenya"],
        datasets: [
            {
                label: "Private Self Concept",
                backgroundColor: [
                    'rgb(58, 71, 153)'
                ],
                data: [scorePersonal,48,2]
            },
            {
                label: "Collectivist Self Concept",
                backgroundColor: [
                    'rgb(93, 163, 114)'
                ],
                data: [scoreRelationships,52,98]
            },
        ]
    };

    var myBarChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            barValueSpacing: 20,
            scales: {
                yAxes: [{
                    ticks: {
                        min: 0,
                    }
                }]
            }
        }
    });
  }

  exports.results = {};
  exports.results.drawBarGraphic = renderChart;

  })(window.LITW = window.LITW || {});