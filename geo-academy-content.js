
/* =====================================================
   GEO ACADEMY CONTENT
   Global GIS, Surveying & Engineering Course Directory
   Version: 1.0
   ===================================================== */

(function () {
  "use strict";

  const categories = [
    {
      id: "gis",
      name: "نظم المعلومات الجغرافية GIS",
      topics: [
        "ArcGIS Pro",
        "ArcMap",
        "QGIS",
        "WebGIS",
        "Spatial Analysis",
        "Cartography",
        "Geodatabase",
        "Network Analyst"
      ]
    },
    {
      id: "surveying",
      name: "المساحة والجيوماتكس",
      topics: [
        "Total Station",
        "GNSS",
        "GPS",
        "Leveling",
        "Traverse",
        "Engineering Surveying",
        "Land Surveying",
        "Drone Surveying"
      ]
    },
    {
      id: "remote-sensing",
      name: "الاستشعار عن بعد",
      topics: [
        "ERDAS Imagine",
        "ENVI",
        "Google Earth Engine",
        "Sentinel",
        "Landsat",
        "SAR",
        "LiDAR",
        "Photogrammetry"
      ]
    },
    {
      id: "civil3d",
      name: "Civil 3D",
      topics: [
        "Civil 3D Basics",
        "Road Design",
        "Corridors",
        "Surfaces",
        "Grading",
        "Earthworks",
        "Pipe Networks"
      ]
    },
    {
      id: "python-gis",
      name: "Python for GIS",
      topics: [
        "Python Basics",
        "GeoPandas",
        "Rasterio",
        "Shapely",
        "Fiona",
        "Matplotlib",
        "Jupyter"
      ]
    },
    {
      id: "gis-programming",
      name: "GIS Programming",
      topics: [
        "ArcPy",
        "PyQGIS",
        "JavaScript GIS",
        "GeoAI",
        "Machine Learning",
        "GIS Automation",
        "PostGIS",
        "GDAL"
      ]
    },
    {
      id: "autocad",
      name: "AutoCAD",
      topics: [
        "AutoCAD 2D",
        "AutoCAD 3D",
        "AutoCAD Civil",
        "Technical Drawing",
        "CAD Standards"
      ]
    },
    {
      id: "autocad-ai",
      name: "AutoCAD + AI",
      topics: [
        "AI for CAD",
        "CAD Automation",
        "AutoLISP",
        "Python CAD",
        "AI Drawing Workflows"
      ]
    }
  ];

  /*
   * مصادر تعليمية رسمية ومفتوحة.
   * هذه روابط للمصادر الأصلية وليست نسخًا من محتوى الدورات.
   */

  const sources = [
    {
      id: "esri-academy",
      name: "Esri Academy",
      platform: "Esri",
      url: "https://www.esri.com/training/",
      categories: ["gis", "remote-sensing"],
      language: "English",
      type: "official-catalog"
    },
    {
      id: "qgis-training",
      name: "QGIS Training Manual",
      platform: "QGIS",
      url: "https://docs.qgis.org/latest/en/docs/training_manual/",
      categories: ["gis", "gis-programming"],
      language: "English",
      price: "free",
      type: "official-documentation"
    },
    {
      id: "autodesk-learning",
      name: "Autodesk Learning",
      platform: "Autodesk",
      url: "https://www.autodesk.com/learn",
      categories: ["autocad", "civil3d"],
      language: "Multiple",
      type: "official-catalog"
    },
    {
      id: "autodesk-autocad",
      name: "AutoCAD Learning",
      platform: "Autodesk",
      url: "https://www.autodesk.com/learn/ondemand/collections/autocad",
      categories: ["autocad"],
      language: "English",
      type: "official-catalog"
    },
    {
      id: "spatial-thoughts",
      name: "Spatial Thoughts OpenCourseWare",
      platform: "Spatial Thoughts",
      url: "https://courses.spatialthoughts.com/",
      categories: ["gis", "python-gis", "gis-programming", "remote-sensing"],
      language: "English",
      price: "free",
      type: "open-courseware"
    },
    {
      id: "narss",
      name: "National Authority for Remote Sensing and Space Sciences",
      platform: "NARSS",
      url: "https://training.narss.sci.eg/",
      categories: ["gis", "remote-sensing", "surveying", "python-gis"],
      language: "Arabic/English",
      type: "official-catalog"
    },
    {
      id: "esa-egypt",
      name: "Egyptian Survey Authority",
      platform: "Egyptian Survey Authority",
      url: "https://www.esa.gov.eg/",
      categories: ["surveying", "gis", "autocad", "civil3d"],
      language: "Arabic",
      type: "official-source"
    },
    {
      id: "youtube",
      name: "YouTube Educational Search",
      platform: "YouTube",
      url: "https://www.youtube.com/",
      categories: [
        "gis",
        "surveying",
        "remote-sensing",
        "civil3d",
        "python-gis",
        "gis-programming",
        "autocad",
        "autocad-ai"
      ],
      language: "Multiple",
      type: "video-platform"
    },
    {
      id: "coursera",
      name: "Coursera",
      platform: "Coursera",
      url: "https://www.coursera.org/",
      categories: ["gis", "remote-sensing", "python-gis"],
      language: "Multiple",
      type: "course-platform"
    },
    {
      id: "edx",
      name: "edX",
      platform: "edX",
      url: "https://www.edx.org/",
      categories: ["gis", "python-gis", "gis-programming"],
      language: "Multiple",
      type: "course-platform"
    },
    {
      id: "udemy",
      name: "Udemy",
      platform: "Udemy",
      url: "https://www.udemy.com/",
      categories: [
        "gis",
        "surveying",
        "civil3d",
        "autocad",
        "python-gis"
      ],
      language: "Multiple",
      type: "course-platform"
    }
  ];

  /*
   * روابط بحث مخصصة لكل تخصص.
   * البحث يفتح نتائج المنصة الأصلية.
   */
const realCourses = [
  {
    id: "qgis-intro",
    title: "Introduction to QGIS",
    category: "gis",
    provider: "Spatial Thoughts",
    level: "مبتدئ",
    language: "English",
    price: "مجاني للدراسة الذاتية",
    url: "https://spatialthoughts.com/courses/introduction-to-qgis/"
  },
  {
    id: "qgis-advanced",
    title: "Advanced QGIS",
    category: "gis",
    provider: "Spatial Thoughts",
    level: "متوسط",
    language: "English",
    price: "راجع المصدر",
    url: "https://courses.spatialthoughts.com/"
  },
  {
    id: "narss-remote",
    title: "Introduction to Remote Sensing",
    category: "remote-sensing",
    provider: "NARSS",
    level: "مبتدئ",
    language: "Arabic / English",
    price: "مجاني حسب الكتالوج",
    url: "https://narss.sci.eg/search"
  },
  {
    id: "narss-surveying",
    title: "Terrestrial and Airborne Surveying",
    category: "surveying",
    provider: "NARSS",
    level: "متوسط",
    language: "Arabic / English",
    price: "مجاني حسب صفحة الدورة",
    url: "https://narss.sci.eg/course-description/terrestrial-and-airborne-surveying"
  },
  {
    id: "esa-civil3d",
    title: "Basic AutoCAD Civil 3D",
    category: "civil3d",
    provider: "Egyptian Survey Authority",
    level: "مبتدئ",
    language: "Arabic",
    price: "مدفوع",
    url: "https://www.esa.gov.eg/AutoCADCivilA.aspx"
  },
  {
    id: "autodesk-civil3d",
    title: "Learn Civil 3D in 90 Minutes",
    category: "civil3d",
    provider: "Autodesk",
    level: "مبتدئ",
    language: "English",
    price: "راجع المصدر",
    url: "https://app.learn-one.autodesk.com/learn/ondemand/course/learn-civil-3d-in-90-minutes"
  },
  {
    id: "autodesk-autocad",
    title: "AutoCAD Tutorials",
    category: "autocad",
    provider: "Autodesk",
    level: "متعدد المستويات",
    language: "English",
    price: "مجاني ومدفوع حسب المحتوى",
    url: "https://www.autodesk.com/solutions/aec/autocad-tutorials"
  },
  {
    id: "spatial-python",
    title: "Python Foundation for Spatial Analysis",
    category: "python-gis",
    provider: "Spatial Thoughts",
    level: "مبتدئ",
    language: "English",
    price: "راجع المصدر",
    url: "https://courses.spatialthoughts.com/"
  }
];
  const searchTemplates = {
    youtube: "https://www.youtube.com/results?search_query=",
    coursera: "https://www.coursera.org/search?query=",
    udemy: "https://www.udemy.com/courses/search/?q=",
    edx: "https://www.edx.org/search?q="
  };

  function searchUrl(platform, query) {
    const base = searchTemplates[platform];
    if (!base) return null;

    return base + encodeURIComponent(query);
  }

  function getCategory(categoryId) {
    return categories.find(item => item.id === categoryId) || null;
  }

  function getSources(categoryId) {
    return sources.filter(source =>
      source.categories.includes(categoryId)
    );
  }

  function getSearchLinks(categoryId, topic) {
    const category = getCategory(categoryId);
    if (!category) return [];

    const query = topic || category.name;

    return Object.keys(searchTemplates).map(platform => ({
      platform,
      title: category.name + " - " + query,
      url: searchUrl(platform, query)
    })).concat([{
      platform: "YouTube",
      title: category.name + " - " + query,
      url: searchUrl("youtube", query)
    }]);
  }

  const AcademyContent = {
    version: "1.0.0",
    updatedAt: "2026-11-10",

    categories,
sources,
realCourses,

getCourses(categoryId) {
  return realCourses.filter(course =>
    !categoryId || course.category === categoryId
  );
},

    getCategory,
    getSources,
    getSearchLinks,
    searchUrl,

    getAllCategories() {
      return categories.slice();
    },

    getAllSources() {
      return sources.slice();
    },

    search(query) {
      const q = String(query || "").trim().toLowerCase();
      if (!q) return [];

      return categories.filter(category =>
        category.name.toLowerCase().includes(q) ||
        category.topics.some(topic =>
          topic.toLowerCase().includes(q)
        )
      );
    }
  };

  window.GEOAcademyContent = AcademyContent;

  console.log("GEO Academy Content loaded successfully.");
})();
