function getKafkatopicByName(orgId, kafkaTopic) {
    return `org-${orgId}.sensor-${sensorType}`;
}

module.exports = {
    getKafkatopicByName,
}