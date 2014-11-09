var app = angular.module('bookmarks', [
  'ngTable',
  'ui.bootstrap',
  'ngScope'
]);

app.controller('Search', [
  '$scope',
  '$filter',
  '$timeout',
  'ngTableParams',
  function (
    $scope,
    $filter,
    $timeout,
    ngTableParams
  ) {

    $scope.results = [];
    $scope.form = {
      text: ''
    };
    $scope.datepickerStates = {};
    $scope.checkboxes = {checked: false, items: {}};

    $scope.clear = function ($event, name) {
      var $el = $($event.target);
      var $form = $el.closest('form');
      var $item = $form.find('[name="' + name + '"]');
      $item.val('');
      // use $timeout to prevent '$apply is already in progress' error
      $timeout(function () {
        $item.change();
      });
    };

    $scope.change = function () {
      this.doSearch();
    };

    $scope.showJSON = function ($event, json) {
      $event.preventDefault();
      $event.stopPropagation();
      bootbox.alert('<pre>' + $filter('json')(json) + '</pre>');
    }

    $scope.submit = function ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    };

    $scope.doSearch = function(text) {
      text = text || $scope.form.text || '';
      console.log('searching: "' + text + '"');
      $scope.loading = true;
      chrome.bookmarks.search(text, function (results) {
        $scope.$apply(function () {
          $scope.results = results;
          $scope.loading = false;
          $scope.tableParams.reload();
        });
      });
    };

    $scope.tableParams = new ngTableParams(
      {
        page: 1,
        count: 10
      },
      {
        total: 0,
        getData: function($defer, params) {
          var data = $scope.results;
          var dateAddedStart = $scope.form.dateAddedStart;
          var dateAddedEnd = $scope.form.dateAddedEnd;

          var filteredData = $filter('filter')(data, function (value) {
            if (dateAddedStart && dateAddedStart > value.dateAdded) {
              return false;
            }
            if (dateAddedEnd && (dateAddedEnd.getTime() + 1000*60*60*24) < value.dateAdded) {
              return false;
            }
            return true;
          });

          var orderedData = params.sorting() ?
            $filter('orderBy')(filteredData, params.orderBy()) :
            filteredData;

          params.total(orderedData.length);

          $defer.resolve(
            orderedData.slice((params.page() - 1) * params.count(),
            params.page() * params.count())
          );
        }
      }
    );

    // $scope.form.text = 'git';
    // $scope.doSearch();
  }
]);
