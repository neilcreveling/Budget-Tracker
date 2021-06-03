let db;

// Create a new db request for a "budget" database.
const request = indexedDB.open('BudgetDB', 1);

// upgrade request
request.onupgradeneeded = function (e) {
  console.log('Upgrade needed in IndexDB');

  db = e.target.result;

  if (!db.objectStoreNames.contains('BudgetStore')) {
    db.createObjectStore("BudgetStore", { autoIncrement: true});
  }
};

request.onerror = function (e) {
  console.log(`Woops! ${e.target.errorCode}`);
};

// onsuccess request
request.onsuccess = function (e) {
    console.log('Success Event', e);
    db = e.target.result;
        let oldVersion = e.oldVersion;
        let newVersion = e.newVersion || db.version;
        if (!oldVersion) {
            console.log(`DB currently running on version ${db.version} - no updates at this time`);
        } else {
            console.log(`DB updated from version ${oldVersion} to ${newVersion}`);
        }
    if (navigator.onLine) {
        checkDatabase();
    }
};

// save records
function saveRecord(record) {
    console.log('saving record...');
    console.log(record);
    const transaction = db.transaction(['BudgetStore'], 'readwrite');
    const offLineStore = transaction.objectStore('BudgetStore');
    offLineStore.add(record);
};

//check database
function checkDatabase() {
    console.log('check db invoked');
    let transaction = db.transaction(['BudgetStore'], 'readwrite');
    const store = transaction.objectStore('BudgetStore');
    const getAll = store.getAll();

    //if successful
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((res) => {
                if (res.length !== 0) {
                    transaction = db.transaction(['BudgetStore'], 'readwrite');
                    const updatedStore = transaction.objectStore('BudgetStore');   
                    updatedStore.clear();
                    console.log('clearing store...');
                }
            });
        }
    };
};

//listen for app coming back online
window.addEventListener('online', checkDatabase);