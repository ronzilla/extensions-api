'use strict';

// Wrap everything in an anonymous function to avoid poluting the global namespace
(function () {
  $(document).ready(function () {
    tableau.extensions.initializeAsync().then(function () {
      // Since dataSource info is attached to the worksheet, we will perform
      // one async call per worksheet to get every dataSource used in this
      // dashboard.  This demonstrates the use of Promise.all to combine
      // promises together and wait for each of them to resolve.
      let dataSourceFetchPromises = [];

      // Maps dataSource id to dataSource so we can keep track of unique dataSources.
      let dashboardDataSources = {};

      // To get dataSource info, first get the dashboard.
      const dashboard = tableau.extensions.dashboardContent.dashboard;

      // Then loop through each worksheet and get its dataSources, save promise for later.
      dashboard.worksheets.forEach(function (worksheet) {
        dataSourceFetchPromises.push(worksheet.getDataSourcesAsync());
      });

      Promise.all(dataSourceFetchPromises).then(function (fetchResults) {
        fetchResults.forEach(function (dataSourcesForWorksheet) {
          dataSourcesForWorksheet.forEach(function (dataSource) {
            if (!dashboardDataSources[dataSource.id]) { // We've already seen it, skip it.
              dashboardDataSources[dataSource.id] = dataSource;
            }
          });
        });

        buildDataSourcesTable(dashboardDataSources);

        // This just modifies the UI by removing the loading banner and showing the dataSources table.
        $('#loading').addClass('hidden');
        $('#dataSourcesTable').removeClass('hidden').addClass('show');
      });
    }, function (err) {
      // Something went wrong in initialization.
      console.log('Error while Initializing: ' + err.toString());
    });
  });

  // Refreshes the a given dataSource.
  function refreshDataSource (dataSource) {
    dataSource.refreshAsync().then(function () {
      console.log(dataSource.name + ': Refreshed Successfully');
    });
  }

  // Displays a modal dialog with more details about a given dataSource.
  function showModal (dataSource) {
    var modal = $('#infoModal');

    $('#nameDetail').text(dataSource.name);
    $('#idDetail').text(dataSource.id);
    $('#typeDetail').text((dataSource.isExtract) ? 'Extract' : 'Live');

    // Loop through every field in the dataSource and concat it to a string.
    var fieldNamesStr = '';
    dataSource.fields.forEach(function (field) {
      fieldNamesStr += field.name + ', ';
    });

    // Slice of the last ", " for formatting.
    $('#fieldsDetail').text(fieldNamesStr.slice(0, -2));

    modal.modal('show');
  }

  // Contructs UI that displays all the dataSources in this dashboard
  // given a mapping from dataSourceId to dataSource objects.
  function buildDataSourcesTable (dataSources) {
    // Clear the table first.
    $('#dataSourcesTable > tbody tr').remove();
    const dataSourcesTable = $('#dataSourcesTable > tbody')[0];

    // Add an entry to the dataSources table for each dataSource.
    for (let dataSourceId in dataSources) {
      const dataSource = dataSources[dataSourceId];

      let newRow = dataSourcesTable.insertRow(dataSourcesTable.rows.length);
      let nameCell = newRow.insertCell(0);
      let refreshCell = newRow.insertCell(1);
      let infoCell = newRow.insertCell(2);

      let refreshButton = document.createElement('button');
      refreshButton.innerHTML = ('Refresh Now');
      refreshButton.type = 'button';
      refreshButton.className = 'btn btn-primary';
      refreshButton.addEventListener('click', function () { refreshDataSource(dataSource); });

      let infoSpan = document.createElement('span');
      infoSpan.className = 'glyphicon glyphicon-info-sign';
      infoSpan.addEventListener('click', function () { showModal(dataSource); });

      nameCell.innerHTML = dataSource.name;
      refreshCell.appendChild(refreshButton);
      infoCell.appendChild(infoSpan);
    }
  }
})();