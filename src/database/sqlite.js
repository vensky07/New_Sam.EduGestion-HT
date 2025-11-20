import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('edugestion.db');

export const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Table des utilisateurs
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          firstName TEXT,
          lastName TEXT,
          email TEXT,
          matricule TEXT,
          role TEXT,
          createdAt TEXT
        );`
      );

      // Table des notes
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS grades (
          id TEXT PRIMARY KEY,
          userId TEXT,
          courseName TEXT,
          professor TEXT,
          grade REAL,
          semester TEXT,
          date TEXT,
          comment TEXT,
          FOREIGN KEY (userId) REFERENCES users(id)
        );`
      );

      // Table de l'emploi du temps
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS schedule (
          id TEXT PRIMARY KEY,
          userId TEXT,
          courseName TEXT,
          professor TEXT,
          dayOfWeek TEXT,
          startTime TEXT,
          endTime TEXT,
          location TEXT,
          room TEXT,
          FOREIGN KEY (userId) REFERENCES users(id)
        );`
      );

      // Table des notifications
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          userId TEXT,
          title TEXT,
          message TEXT,
          type TEXT,
          createdAt TEXT,
          read INTEGER DEFAULT 0,
          FOREIGN KEY (userId) REFERENCES users(id)
        );`
      );

      // Table des ressources
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS resources (
          id TEXT PRIMARY KEY,
          userId TEXT,
          title TEXT,
          description TEXT,
          course TEXT,
          type TEXT,
          url TEXT,
          uploadedAt TEXT,
          FOREIGN KEY (userId) REFERENCES users(id)
        );`
      );

      // Table de synchronisation
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          action TEXT,
          table_name TEXT,
          data TEXT,
          timestamp TEXT,
          synced INTEGER DEFAULT 0
        );`
      );
    }, reject, resolve);
  });
};

export const insertUser = async (user) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO users (id, firstName, lastName, email, matricule, role, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.firstName,
          user.lastName,
          user.email,
          user.matricule,
          user.role,
          user.createdAt,
        ],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

export const insertGrade = async (grade) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO grades (id, userId, courseName, professor, grade, semester, date, comment)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          grade.id,
          grade.userId,
          grade.courseName,
          grade.professor,
          grade.grade,
          grade.semester,
          grade.date,
          grade.comment,
        ],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

export const insertSchedule = async (schedule) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO schedule (id, userId, courseName, professor, dayOfWeek, startTime, endTime, location, room)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          schedule.id,
          schedule.userId,
          schedule.courseName,
          schedule.professor,
          schedule.dayOfWeek,
          schedule.startTime,
          schedule.endTime,
          schedule.location,
          schedule.room,
        ],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

export const insertNotification = async (notification) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO notifications (id, userId, title, message, type, createdAt, read)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          notification.id,
          notification.userId,
          notification.title,
          notification.message,
          notification.type,
          notification.createdAt,
          notification.read || 0,
        ],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

export const getGradesByUser = async (userId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM grades WHERE userId = ? ORDER BY date DESC`,
        [userId],
        (_, result) => resolve(result.rows._array),
        (_, error) => reject(error)
      );
    });
  });
};

export const getScheduleByUser = async (userId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM schedule WHERE userId = ? ORDER BY dayOfWeek, startTime`,
        [userId],
        (_, result) => resolve(result.rows._array),
        (_, error) => reject(error)
      );
    });
  });
};

export const getNotificationsByUser = async (userId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC`,
        [userId],
        (_, result) => resolve(result.rows._array),
        (_, error) => reject(error)
      );
    });
  });
};

export const clearDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM grades;');
      tx.executeSql('DELETE FROM schedule;');
      tx.executeSql('DELETE FROM notifications;');
      tx.executeSql('DELETE FROM resources;');
      tx.executeSql('DELETE FROM users;');
    }, reject, resolve);
  });
};

export default db;
