import { useState } from "react";
import { BookOpen, Clock, Star, Users, Search, Play, Lock } from "lucide-react";
import { Card, CardBody } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ProgressBar from "../components/ui/ProgressBar";
import { Tabs } from "../components/ui/Tabs";

const allCourses = [
  {
    id: 1, category: "Blockchain", title: "Blockchain Fundamentals",
    level: "Beginner", duration: "6h", students: 12400, rating: 4.9,
    locked: false, progress: 75, lessons: 12, completedLessons: 9,
    instructor: "Dr. Ada Chain",
    image: "https://images.pexels.com/photos/6771985/pexels-photo-6771985.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 2, category: "Blockchain", title: "Smart Contract Development",
    level: "Intermediate", duration: "10h", students: 8200, rating: 4.8,
    locked: false, progress: 0, lessons: 14, completedLessons: 0,
    instructor: "Carlos Ether",
    image: "https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 3, category: "Crypto", title: "DeFi Masterclass",
    level: "Advanced", duration: "12h", students: 5100, rating: 4.9,
    locked: true, progress: 20, lessons: 16, completedLessons: 3,
    instructor: "Yuki Nakamoto",
    image: "https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: 4, category: "AI", title: "AI & Machine Learning Basics",
    level: "Beginner", duration: "8h", students: 15600, rating: 4.7,
    locked: false, progress: 40, lessons: 10, completedLessons: 4,
    instructor: "Sarah Neural",
    image: "https://images.pexels.com/photos/8438918/pexels-photo-8438918.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
];

const categories = ["All", "Blockchain", "AI", "Crypto", "Web3"];
const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

const levelColor = { Beginner: "green", Intermediate: "amber", Advanced: "red" };
const categoryColor = { Blockchain: "cyan", AI: "blue", Crypto: "amber", Web3: "green" };

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeLevel, setActiveLevel] = useState("All Levels");
  const [tabView, setTabView] = useState("all");

  const enrolled = allCourses.filter((c) => c.progress > 0);
  const displayed = (tabView === "enrolled" ? enrolled : allCourses).filter((c) => {
    const matchCat = activeCategory === "All" || c.category === activeCategory;
    const matchLevel = activeLevel === "All Levels" || c.level === activeLevel;
    const matchSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchLevel && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Course Library</h2>
          <p className="text-sm text-slate-500 mt-0.5">Master crypto and AI at your own pace</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-800 border border-white/[0.06] rounded-xl px-3 py-2 w-48">
          <Search size={13} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent text-slate-300 placeholder-slate-600 outline-none"
          />
        </div>
      </div>

      {/* View tabs */}
      <Tabs
        tabs={[
          { id: "all", label: "All Courses", badge: allCourses.length },
          { id: "enrolled", label: "In Progress", badge: enrolled.length },
        ]}
        defaultTab={tabView}
        onChange={setTabView}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border
              ${activeCategory === cat
                ? "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/25"
                : "text-slate-500 border-white/[0.06] hover:text-slate-300"
              }`}
          >
            {cat}
          </button>
        ))}
        <div className="w-px bg-white/[0.06] self-stretch mx-1" />
        {levels.map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => setActiveLevel(lv)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border
              ${activeLevel === lv
                ? "bg-surface-600 text-slate-200 border-white/[0.12]"
                : "text-slate-500 border-white/[0.06] hover:text-slate-300"
              }`}
          >
            {lv}
          </button>
        ))}
      </div>

      {/* Course grid */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen size={32} className="text-slate-600 mb-3" />
          <p className="text-slate-500">No courses match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl bg-surface-800/80 border border-white/[0.06] overflow-hidden hover:border-white/[0.10] hover:-translate-y-0.5 transition-all duration-200 group"
            >
              {/* Thumbnail */}
              <div className="relative h-40 overflow-hidden bg-surface-700">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-900/80 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge variant={categoryColor[course.category] || "default"}>{course.category}</Badge>
                  <Badge variant={levelColor[course.level] || "default"}>{course.level}</Badge>
                </div>
                {course.locked && (
                  <div className="absolute top-3 right-3">
                    <div className="w-7 h-7 rounded-full bg-surface-900/80 backdrop-blur-sm flex items-center justify-center">
                      <Lock size={12} className="text-slate-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-100 mb-1">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-500 mb-3">{course.instructor}</p>

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1"><Clock size={11} /> {course.duration}</span>
                  <span className="flex items-center gap-1"><Users size={11} /> {(course.students / 1000).toFixed(1)}k</span>
                  <span className="flex items-center gap-1"><Star size={11} className="text-brand-amber" /> {course.rating}</span>
                </div>

                {course.progress > 0 && (
                  <div className="mb-3">
                    <ProgressBar value={course.progress} color="cyan" showValue label={`${course.completedLessons}/${course.lessons} lessons`} />
                  </div>
                )}

                <Button
                  variant={course.locked ? "outline" : course.progress > 0 ? "primary" : "secondary"}
                  size="sm"
                  className="w-full"
                  leftIcon={course.locked ? <Lock size={13} /> : <Play size={13} />}
                >
                  {course.locked ? "Unlock Course" : course.progress > 0 ? "Continue" : "Start Course"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
