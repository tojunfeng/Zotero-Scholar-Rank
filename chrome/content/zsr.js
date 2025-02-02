let zsr = {
    _baseUrl : 'https://scholarrank.ssang.top:28087'
};

zsr.init = function() {
    // Register the callback in Zotero as an item observer
    let notifierID = Zotero.Notifier.registerObserver(
        this.notifierCallback, ['item']);

    // Unregister callback when the window closes (important to avoid a memory leak)
    window.addEventListener('unload', function(e) {
        Zotero.Notifier.unregisterObserver(notifierID);
    }, false);
};

zsr.notifierCallback = {
    notify: function(event, type, ids, extraData) {
        if (event == 'add') {
            zsr.processItems(Zotero.Items.get(ids));
        }
    }
};

zsr.updateCollectionMenuEntry = function() {
    if (!ZoteroPane.canEditLibrary()) {
        alert('You lack the permission to make edit to this library.');
        return;
    }

    let group = ZoteroPane.getSelectedGroup();
    if (group) {
        this.updateGroup(ZoteroPane.getSelectedGroup());
        return;
    };

    let collection = ZoteroPane.getSelectedCollection();
    if (collection) {
        this.updateCollection(collection);
        return;
    }

    alert('Updating citations for this type of Entry is not supported.');
    return;
};

zsr.updateItemMenuEntries = function() {
    if (!ZoteroPane.canEditLibrary()) {
        alert('You lack the permission to make edit to this library.');
        return;
    }
    this.processItems(ZoteroPane.getSelectedItems());
};

zsr.updateGroup = function(group) {
    alert('Updating a Group is not yet implemented.')
    return;
    //this.processUpdateQueue(items);
};

zsr.updateCollection = function(collection) {
    this.processItems(collection.getChildItems());
    let childColls = collection.getChildCollections();
    for (idx = 0; idx < childColls.length; ++idx) {
        this.updateCollection(childColls[idx]);
    }
};
// zsr.hasRequiredFields = function(item) {
//     return item.getField('publicationTitle') || item.getField('proceedingsTitle')||item.getField('conferenceName')||item.getField('university') ;
// }
zsr.processItems = function(items) {
    while (item = items.shift()) {
        // if (!zsr.hasRequiredFields(item)) {
        //     item.setField('callNumber', "Not found");
        //         item.saveTx();
        //     continue;
        // }
        this.getRank(item,function(item, rank){
                item.setField('callNumber', rank);
                item.saveTx();
            }
        );       

    }
}
zsr.getRank = function(item,cb){
    let url;
    if (item.itemType == 'journalArticle'){
        if (item.getField('publicationTitle')){url = encodeURI(zsr._baseUrl+"/1/" +item.getField('publicationTitle'));}//1:期刊，2：会议
        else{item.setField('callNumber', "Not found");
                item.saveTx();return 0;}
    }
    else if (item.itemType == 'conferencePaper'){
        if (item.getField('proceedingsTitle') && item.getField('conferenceName')){url = encodeURI(zsr._baseUrl+"/2/" +item.getField('proceedingsTitle')+" &&& "+item.getField('conferenceName'));}
        else if (item.getField('proceedingsTitle') ){url = encodeURI(zsr._baseUrl+"/2/" +item.getField('proceedingsTitle'));}
        else if (item.getField('conferenceName')){url = encodeURI(zsr._baseUrl+"/2/" +item.getField('conferenceName'));}
        else{item.setField('callNumber', "Not found");
        item.saveTx();return 0;}
    }
    else if(item.itemType == 'thesis'){
        item.setField('callNumber', item.getField('university'));
        item.saveTx();
        return 0;
    }else{
        return 0;
    }
    var http=new XMLHttpRequest();
        http.open('get', url, true);
        http.onreadystatechange=function(){
            if ( http.readyState == 4 && http.status == 200 ) {
                cb(item,http.responseText); 
            } else {
                cb(item,"Net Error");
            }
        }            
        http.send();
}

if (typeof window !== 'undefined') {
    window.addEventListener('load', function(e) { zsr.init(); }, false);

    // API export for Zotero UI
    // Can't imagine those to not exist tbh
    if (!window.Zotero) window.Zotero = {};
    if (!window.Zotero.ScholarRank) window.Zotero.ScholarRank = {};
    // note sure about any of this
    window.Zotero.ScholarRank.updateCollectionMenuEntry
        = function() { zsr.updateCollectionMenuEntry(); };
    window.Zotero.ScholarRank.updateItemMenuEntries
        = function() { zsr.updateItemMenuEntries(); };
}

if (typeof module !== 'undefined') module.exports = zsr;
