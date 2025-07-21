const fs = require('fs');
const path = require('path');

// const logDir = path.join(__dirname, '..', '..', 'logs');
const logDir = '/app/logs';

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function getLogFilePath() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(logDir, `mail-server-${date}.log`);
}

function writeLog(type, action, email, message = '', ip = '-') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${action} - ${email} | IP: ${ip} ${message ? '| ' + message : ''}\n`;

  console.log(`Writing log: ${logMessage.trim()} to ${getLogFilePath()}`);

  fs.appendFile(getLogFilePath(), logMessage, (err) => {
    if (err) console.error('Lỗi ghi log:', err);
  });
}

module.exports = {
  // AUTH logs
  logCreateUser: (username, ip) => writeLog('AUTH', 'CREATE_USER', username, '', ip),
  logRegister: (email, username, ip) => writeLog('AUTH', 'REGISTER', email, `Register new user: ${username}`, ip),
  logLogin: (email, ip, success = true) =>
    writeLog('AUTH', 'LOGIN', email, `Status: ${success ? 'SUCCESS' : 'FAIL'}`, ip),
  logLogout: (email, ip) => writeLog('AUTH', 'LOGOUT', email, '', ip),

  // MAIL logs
  logSend: (emailFrom, emailTo, subject, ip) => writeLog('MAIL', 'SEND', emailFrom, `To: ${emailTo} - Subject: "${subject}"`, ip),
  logReceive: (email, subject, ip) => writeLog('MAIL', 'RECEIVE', email, `Subject: "${subject}"`, ip),

  // SYSTEM / SECURITY
  logConfigChange: (admin, details, ip) => writeLog('SYSTEM', 'CONFIG_UPDATE', admin, details, ip),
  logSecurityWarning: (email, reason, ip) => writeLog('SECURITY', 'SECURITY_ALERT', email, reason, ip),

  // ERROR log
  logError: (context, err, ip = '-') =>
    writeLog('ERROR', 'EXCEPTION', context, err.message || err.toString(), ip)
};
