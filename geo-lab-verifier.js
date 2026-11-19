/* GEO Lab Verifier v1
 * فحص ثابت (static) للكود المولَّد في مختبر الأكواد قبل عرضه على المستخدم.
 * لا يشغّل الكود ولا يضمن صحته في ArcGIS أو AutoCAD؛ هو يلقط الأخطاء الشائعة:
 * دوال غير موجودة في القائمة المعتمدة، مسارات بباكسلاش مضاعف، أقواس غير متوازنة، وغيرها.
 */
(function () {
  "use strict";

  // قوائم معتمدة: أي دالة/أمر مش هنا يتعلّم كـ "مشكوك فيه"
  const ALLOW = {
    arcpy: new Set([
      "env", "Exists", "ListFeatureClasses", "ListDatasets", "ListRasters", "ListFields",
      "Describe", "GetMessages", "ExecuteError", "Raster", "Geometry", "Point", "Array",
      "SpatialReference", "FromWKT", "da", "analysis", "management", "conversion", "sa",
      "stats", "ListTables", "ListWorkspaces", "CheckExtension", "CheckOutExtension",
      "CheckInExtension", "Project", "ProjectRaster"
    ]),
    lisp: new Set([
      "defun", "setq", "if", "cond", "progn", "while", "entsel", "entget", "assoc", "cdr", "car",
      "vlax-ename->vla-object", "vlax-get", "vlax-variant-value", "vlax-safearray->list",
      "vl-load-com", "getfiled", "getstring", "getpoint", "open", "close", "write-line", "princ",
      "strcat", "itoa", "rtos", "nth", "length", "not", "null", "/=", "=", "<", ">", "+", "-",
      "*", "/", "1+", "1-", "t", "nil", "entmake", "command", "ssget", "sslength", "ssname",
      "vla-get-coordinates", "setvar", "getvar", "list", "cons", "append", "mapcar", "lambda"
    ])
  };

  function stripPythonStrings(code) {
    // يشيل التعليقات والنصوص عشان ميلقطش دوال داخلها
    return code.replace(/#.*$/gm, "").replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, "")
      .replace(/r?"(?:\\.|[^"\\\n])*"/g, '""').replace(/r?'(?:\\.|[^'\\\n])*'/g, "''");
  }

  function checkPython(code) {
    const errors = [], warnings = [];
    const clean = stripPythonStrings(code);

    // 1) دوال arcpy.* لازم تكون في القائمة
    const calls = new Set();