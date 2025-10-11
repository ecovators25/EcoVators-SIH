/**
 * EcoVators Data Visualization
 * Creates interactive charts for environmental impact data
 */

const DataVisualization = {
    // Initialize data visualization
    init: function() {
        // Load Chart.js from CDN if not already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => this.renderCharts();
            document.head.appendChild(script);
        } else {
            this.renderCharts();
        }
    },

    // Render all charts
    renderCharts: function() {
        this.createImpactChart();
        this.createProgressChart();
        this.createCommunityComparisonChart();
    },

    // Create environmental impact chart
    createImpactChart: function() {
        const impactSection = document.querySelector('.eco-impact');
        if (!impactSection) return;

        // Create canvas for the chart
        const chartContainer = document.createElement('div');
        chartContainer.className = 'impact-chart-container';
        chartContainer.innerHTML = '<canvas id="impactChart"></canvas>';
        
        // Insert after the metrics
        const metricsContainer = impactSection.querySelector('.impact-metrics');
        if (metricsContainer) {
            metricsContainer.parentNode.insertBefore(chartContainer, metricsContainer.nextSibling);
        } else {
            impactSection.appendChild(chartContainer);
        }

        // Sample data - in a real app, this would come from an API
        const impactData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Trees Planted',
                    data: [1, 2, 3, 5, 8, 10],
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Waste Reduced (kg)',
                    data: [5, 10, 15, 25, 40, 50],
                    backgroundColor: 'rgba(255, 152, 0, 0.2)',
                    borderColor: 'rgba(255, 152, 0, 1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Water Saved (L)',
                    data: [100, 200, 350, 500, 800, 1000],
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'CO2 Offset (kg)',
                    data: [20, 40, 80, 120, 160, 200],
                    backgroundColor: 'rgba(158, 158, 158, 0.2)',
                    borderColor: 'rgba(158, 158, 158, 1)',
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        };

        // Create the chart
        const ctx = document.getElementById('impactChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: impactData,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Your Environmental Impact Over Time',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    // Create progress chart for challenges and goals
    createProgressChart: function() {
        const weeklyGoalsSection = document.querySelector('.weekly-goals');
        if (!weeklyGoalsSection) return;

        // Create canvas for the chart
        const chartContainer = document.createElement('div');
        chartContainer.className = 'progress-chart-container';
        chartContainer.innerHTML = '<canvas id="progressChart"></canvas>';
        
        // Add to the weekly goals section
        weeklyGoalsSection.appendChild(chartContainer);

        // Sample data
        const progressData = {
            labels: ['Plant Trees', 'Reduce Waste', 'Save Water', 'Compost', 'Eco-friendly Transport'],
            datasets: [{
                label: 'Completion Percentage',
                data: [80, 65, 90, 40, 55],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.7)',
                    'rgba(255, 152, 0, 0.7)',
                    'rgba(33, 150, 243, 0.7)',
                    'rgba(156, 39, 176, 0.7)',
                    'rgba(244, 67, 54, 0.7)'
                ],
                borderColor: [
                    'rgba(76, 175, 80, 1)',
                    'rgba(255, 152, 0, 1)',
                    'rgba(33, 150, 243, 1)',
                    'rgba(156, 39, 176, 1)',
                    'rgba(244, 67, 54, 1)'
                ],
                borderWidth: 1
            }]
        };

        // Create the chart
        const ctx = document.getElementById('progressChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: progressData,
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Weekly Goals Progress',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw + '% completed';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    },

    // Create community comparison chart
    createCommunityComparisonChart: function() {
        // Find a suitable container for the community comparison chart
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        // Create section for community comparison
        const communitySection = document.createElement('section');
        communitySection.className = 'community-comparison';
        communitySection.innerHTML = `
            <h2>Community Comparison</h2>
            <p>See how your environmental impact compares to others in your region</p>
            <div class="comparison-chart-container">
                <canvas id="communityChart"></canvas>
            </div>
        `;
        
        // Add to main content
        mainContent.appendChild(communitySection);

        // Sample data
        const communityData = {
            labels: ['Trees Planted', 'Waste Reduced (kg)', 'Water Saved (L)', 'CO2 Offset (kg)'],
            datasets: [
                {
                    label: 'Your Impact',
                    data: [10, 50, 1000, 200],
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Community Average',
                    data: [7, 35, 750, 150],
                    backgroundColor: 'rgba(33, 150, 243, 0.7)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Top Performers',
                    data: [15, 75, 1500, 300],
                    backgroundColor: 'rgba(156, 39, 176, 0.7)',
                    borderColor: 'rgba(156, 39, 176, 1)',
                    borderWidth: 1
                }
            ]
        };

        // Create the chart
        const ctx = document.getElementById('communityChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: communityData,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Your Impact vs Community',
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Add CSS for the community section
        const style = document.createElement('style');
        style.textContent = `
            .community-comparison {
                background-color: #f8f9fa;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .community-comparison h2 {
                color: #333;
                margin-top: 0;
            }
            
            .community-comparison p {
                color: #666;
                margin-bottom: 20px;
            }
            
            .comparison-chart-container {
                height: 300px;
            }
            
            @media (max-width: 768px) {
                .comparison-chart-container {
                    height: 250px;
                }
            }
        `;
        document.head.appendChild(style);
    }
};

// Initialize data visualization when the page loads
document.addEventListener('DOMContentLoaded', () => {
    DataVisualization.init();
});