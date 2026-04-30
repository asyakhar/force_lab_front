import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../api";
import "./ProfilePage.css";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../components/Notification";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
  });

  const { triggerUpdate } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, [triggerUpdate]);

  const fetchProfile = async () => {
    try {
      const response = await fetchWithAuth("http://localhost:8080/api/profile");
      if (!response.ok) throw new Error("Ошибка загрузки профиля");
      const data = await response.json();
      setProfile(data);
      setEditForm({
        fullName: data.fullName || "",
        phone: data.phone || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetchWithAuth(
        "http://localhost:8080/api/profile",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) throw new Error("Ошибка обновления профиля");

      addNotification("Профиль обновлен!", "info");
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      addNotification(err.message, "error");
    }
  };

  if (loading) return <div className="loading">Загрузка профиля...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div className="error">Профиль не найден</div>;

  const isCoach = profile.role === "COACH";
  const athleteInfo = profile.athleteInfo;

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="header">
        <div className="container header-container">
          <div className="logo" onClick={() => navigate("/")}>
            <span className="logo-text">FORCE LAB</span>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => navigate("/")}>
              На главную
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {/* Профиль */}
        <div className="profile-header">
          <div className="profile-avatar">{isCoach ? "👨‍🏫" : "🏃"}</div>
          <div className="profile-info-header">
            <h1 className="profile-name">{profile.fullName}</h1>
            <span className="profile-role">
              {isCoach ? "Тренер" : "Спортсмен"}
            </span>
          </div>
        </div>

        {/* Табы */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            📋 Информация
          </button>
          <button
            className={`tab-btn ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            📊 Статистика
          </button>
          {!isCoach && (
            <>
              <button
                className={`tab-btn ${
                  activeTab === "achievements" ? "active" : ""
                }`}
                onClick={() => setActiveTab("achievements")}
              >
                🏆 Достижения
              </button>
              <button
                className={`tab-btn ${
                  activeTab === "progress" ? "active" : ""
                }`}
                onClick={() => setActiveTab("progress")}
              >
                📈 Прогресс
              </button>
              <button
                className={`tab-btn ${activeTab === "plans" ? "active" : ""}`}
                onClick={() => setActiveTab("plans")}
              >
                📅 Планы
              </button>
            </>
          )}
        </div>

        {/* Контент табов */}
        <div className="profile-content">
          {/* Информация */}
          {activeTab === "info" && (
            <div className="tab-content">
              <div className="info-card">
                <h3>Основная информация</h3>
                {isEditing ? (
                  <div className="edit-form">
                    <div className="form-group">
                      <label>ФИО</label>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, fullName: e.target.value })
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Телефон</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="form-actions">
                      <button
                        className="btn-primary"
                        onClick={handleSaveProfile}
                      >
                        Сохранить
                      </button>
                      <button
                        className="btn-outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="info-row">
                      <span className="info-label">📧 Email:</span>
                      <span className="info-value">{profile.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">👤 ФИО:</span>
                      <span className="info-value">{profile.fullName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">📱 Телефон:</span>
                      <span className="info-value">
                        {profile.phone || "Не указан"}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">🎯 Роль:</span>
                      <span className="info-value">
                        {isCoach ? "Тренер" : "Спортсмен"}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">📅 Регистрация:</span>
                      <span className="info-value">
                        {new Date(profile.createdAt).toLocaleDateString(
                          "ru-RU"
                        )}
                      </span>
                    </div>

                    {isCoach && (
                      <>
                        <h4 style={{ marginTop: "24px", marginBottom: "16px" }}>
                          Специализации
                        </h4>
                        <div className="specializations">
                          {profile.specializations?.map((spec, index) => (
                            <span key={index} className="specialization-tag">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </>
                    )}

                    {athleteInfo && (
                      <>
                        <h3 style={{ marginTop: "32px" }}>
                          Спортивная информация
                        </h3>
                        <div className="info-row">
                          <span className="info-label">🎯 Вид спорта:</span>
                          <span className="info-value">
                            {athleteInfo.sportType || "Не указан"}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">⭐ Разряд:</span>
                          <span className="info-value">
                            {athleteInfo.rank || "Не указан"}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">📏 Рост:</span>
                          <span className="info-value">
                            {athleteInfo.heightCm
                              ? `${athleteInfo.heightCm} см`
                              : "Не указан"}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">⚖️ Вес:</span>
                          <span className="info-value">
                            {athleteInfo.weightKg
                              ? `${athleteInfo.weightKg} кг`
                              : "Не указан"}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">🏥 Мед. группа:</span>
                          <span className="info-value">
                            {athleteInfo.medicalGroup || "Не указана"}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">👨‍🏫 Тренер:</span>
                          <span className="info-value">
                            {athleteInfo.coachName || "Не назначен"}
                          </span>
                        </div>
                      </>
                    )}

                    <button
                      className="btn-primary"
                      style={{ marginTop: "24px" }}
                      onClick={() => setIsEditing(true)}
                    >
                      ✏️ Редактировать профиль
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Статистика */}
          {activeTab === "stats" && (
            <div className="tab-content">
              <div className="stats-grid">
                {isCoach ? (
                  <>
                    <div className="stat-card">
                      <div className="stat-icon">👥</div>
                      <div className="stat-value">
                        {profile.stats?.totalAthletes || 0}
                      </div>
                      <div className="stat-label">Спортсменов</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">📅</div>
                      <div className="stat-value">
                        {profile.stats?.totalTrainings || 0}
                      </div>
                      <div className="stat-label">Тренировок</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">⭐</div>
                      <div className="stat-value">
                        {profile.stats?.rating || 0}
                      </div>
                      <div className="stat-label">Рейтинг</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stat-card">
                      <div className="stat-icon">📅</div>
                      <div className="stat-value">
                        {profile.stats?.totalTrainings || 0}
                      </div>
                      <div className="stat-label">Тренировок</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">🏆</div>
                      <div className="stat-value">
                        {profile.stats?.totalRecords || 0}
                      </div>
                      <div className="stat-label">Рекордов</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">🎯</div>
                      <div className="stat-value">
                        {profile.stats?.achievements || 0}
                      </div>
                      <div className="stat-label">Достижений</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Достижения */}
          {activeTab === "achievements" && !isCoach && (
            <div className="tab-content">
              <div className="info-card">
                <h3>🏆 Достижения</h3>
                <p>Перейдите на страницу достижений для просмотра</p>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/achievements")}
                >
                  Смотреть достижения
                </button>
              </div>
            </div>
          )}

          {/* Прогресс */}
          {activeTab === "progress" && !isCoach && (
            <div className="tab-content">
              <div className="info-card">
                <h3>📈 Прогресс</h3>
                <p>Перейдите на страницу прогресса для просмотра</p>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/progress")}
                >
                  Смотреть прогресс
                </button>
              </div>
            </div>
          )}

          {/* Планы */}
          {activeTab === "plans" && !isCoach && (
            <div className="tab-content">
              <div className="info-card">
                <h3>📅 Планы тренировок</h3>
                <p>Перейдите на страницу планов для просмотра</p>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/training-plans")}
                >
                  Смотреть планы
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
