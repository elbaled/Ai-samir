/* =========================================
   GEO ACADEMY - Student Learning Database
   Firebase Firestore
========================================= */

(function () {
  "use strict";

  const Academy = {
    db: null,
    auth: null,
    ready: false,

    init() {
      if (!window.firebase || !firebase.apps.length) {
        console.warn("Academy: Firebase is not initialized.");
        return false;
      }

      this.auth = firebase.auth();
      this.db = firebase.firestore();
      this.ready = true;

      console.log("GEO Academy database ready.");
      return true;
    },

    user() {
      return this.auth?.currentUser || null;
    },

    async requireUser() {
      const user = this.user();
      if (!user) throw new Error("يجب تسجيل الدخول أولاً.");
      return user;
    },

    studentRef(uid) {
      return this.db.collection("users")
        .doc(uid)
        .collection("academy")
        .doc("profile");
    },

    async createProfile() {
      const user = await this.requireUser();
      const ref = this.studentRef(user.uid);
      const snap = await ref.get();

      if (!snap.exists) {
        await ref.set({
          uid: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          courses: [],
          notes: [],
          memory: [],
          progress: {}
        });
      }

      return (await ref.get()).data();
    },

    async getProfile() {
      const user = await this.requireUser();
      const snap = await this.studentRef(user.uid).get();
      return snap.exists ? snap.data() : this.createProfile();
    },

    async updateProfile(data) {
      const user = await this.requireUser();

      await this.studentRef(user.uid).set({
        ...data,
        uid: user.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return true;
    },

    async saveNote(title, content) {
      const user = await this.requireUser();
      const ref = this.db.collection("users")
        .doc(user.uid)
        .collection("academy_notes")
        .doc();

      await ref.set({
        title: String(title || "ملاحظة جديدة"),
        content: String(content || ""),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return ref.id;
    },

    async getNotes() {
      const user = await this.requireUser();
      const snap = await this.db.collection("users")
        .doc(user.uid)
        .collection("academy_notes")
        .orderBy("createdAt", "desc")
        .get();

      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },

    async deleteNote(noteId) {
      const user = await this.requireUser();

      await this.db.collection("users")
        .doc(user.uid)
        .collection("academy_notes")
        .doc(noteId)
        .delete();

      return true;
    },

    async saveMemory(content, category = "general") {
      const user = await this.requireUser();

      const ref = this.db.collection("users")
        .doc(user.uid)
        .collection("academy_memory")
        .doc();

      await ref.set({
        content: String(content || ""),
        category: String(category || "general"),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return ref.id;
    },

    async getMemory(limit = 100) {
      const user = await this.requireUser();

      const snap = await this.db.collection("users")
        .doc(user.uid)
        .collection("academy_memory")
        .orderBy("createdAt", "desc")
        .limit(Math.min(Math.max(Number(limit) || 100, 1), 200))
        .get();

      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },

    async deleteMemory(memoryId) {
      const user = await this.requireUser();

      await this.db.collection("users")
        .doc(user.uid)
        .collection("academy_memory")
        .doc(memoryId)
        .delete();

      return true;
    },

    async saveProgress(courseId, progress) {
      const user = await this.requireUser();

      await this.db.collection("users")
        .doc(user.uid)
        .collection("academy_progress")
        .doc(String(courseId))
        .set({
          courseId: String(courseId),
          progress: Math.max(0, Math.min(100, Number(progress) || 0)),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

      return true;
    },

    async getProgress() {
      const user = await this.requireUser();

      const snap = await this.db.collection("users")
        .doc(user.uid)
        .collection("academy_progress")
        .get();

      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
  };

  window.GEOAcademy = Academy;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => Academy.init());
  } else {
    Academy.init();
  }

})();
