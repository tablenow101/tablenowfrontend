import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { settingsAPI } from '../../lib/api';

const IdentifiantsSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [email, setEmail] = useState(user?.email ?? '');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const saveEmail = async () => {
    if (!email.trim()) return;
    setEmailSaving(true);
    setEmailError(null);
    setEmailSuccess(false);
    try {
      await settingsAPI.update({ email: email.trim() });
      await refreshUser();
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch {
      setEmailError("Erreur lors de la mise à jour de l'email.");
    } finally {
      setEmailSaving(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setPwError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setPwSaving(true);
    setPwError(null);
    setPwSuccess(false);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      setPwError(
        err?.response?.data?.message ?? 'Erreur lors du changement de mot de passe.'
      );
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Email */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#555] mb-4">
          Adresse email
        </p>
        <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs text-[#888] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-10 px-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-[#444] transition-colors"
            />
          </div>
          {emailError && <p className="text-sm text-red-400">{emailError}</p>}
          {emailSuccess && <p className="text-sm text-[#b8f000]">Email mis à jour.</p>}
          <button
            onClick={saveEmail}
            disabled={emailSaving || !email.trim() || email === user?.email}
            className="h-10 px-5 bg-[#b8f000] text-black font-bold rounded-xl text-sm disabled:opacity-50"
          >
            {emailSaving ? 'Enregistrement…' : "Mettre à jour l'email"}
          </button>
        </div>
      </div>

      {/* Password */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#555] mb-4">
          Mot de passe
        </p>
        <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs text-[#888] mb-1.5">Mot de passe actuel</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full h-10 px-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-[#444] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[#888] mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full h-10 px-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-[#444] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[#888] mb-1.5">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full h-10 px-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-[#444] transition-colors"
            />
          </div>
          {pwError && <p className="text-sm text-red-400">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-[#b8f000]">Mot de passe modifié.</p>}
          <button
            onClick={savePassword}
            disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
            className="h-10 px-5 bg-[#b8f000] text-black font-bold rounded-xl text-sm disabled:opacity-50"
          >
            {pwSaving ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdentifiantsSettings;
