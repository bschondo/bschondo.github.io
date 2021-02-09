function openProject(evt, projectId, projectClass, tabClass) {
    var i, tabcontent, tablinks;
    var words = evt.currentTarget.className.split(' ')
    var off = words[1] != "active"
    tabcontent = document.getElementsByClassName(tabClass);
    clearTabs(tabcontent);
    tablinks = document.getElementsByClassName(projectClass);
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    if (off) {
        document.getElementById(projectId).style.display = "flex";
        evt.currentTarget.className += " active";
    } else {
        document.getElementById(projectId).style.display = "none";
    }

}

function clearTabs(tabcontent) {
    var i;
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
}
