import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  Bookmark,
  Flame,
  Hourglass,
  Waves,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Compass,
  Layers,
  ChevronRight
} from 'lucide-react';
import { AnimalRecord, UserCollection } from '../../types/taxonomy';
import { repository } from '../../services/supabaseRepository';
import { AnimalCard } from '../discovery/AnimalCard';

interface CollectionsWorkspaceProps {
  allAnimals: AnimalRecord[];
  onSelectAnimal: (animal: AnimalRecord) => void;
  savedAnimalsMap: Record<string, AnimalRecord>;
  onToggleFavorite: (animal: AnimalRecord) => void;
  comparisonIds: string[];
  onToggleCompare: (animal: AnimalRecord) => void;
}

export function CollectionsWorkspace({
  allAnimals,
  onSelectAnimal,
  savedAnimalsMap,
  onToggleFavorite,
  comparisonIds,
  onToggleCompare
}: CollectionsWorkspaceProps) {
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColIcon, setNewColIcon] = useState('Bookmark');

  // Species assignment selector modal
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');

  // Load collections from repository on mount
  const refreshCollections = async () => {
    const list = await repository.getUserCollections();
    setCollections(list);
    if (!activeCollectionId && list.length > 0) {
      setActiveCollectionId(list[0].id);
    }
  };

  useEffect(() => {
    refreshCollections();
  }, []);

  const activeCollection = collections.find((c) => c.id === activeCollectionId) || collections[0];

  // Resolve animal records for the active collection
  const collectionSpecies = React.useMemo(() => {
    if (!activeCollection?.taxonIds) return [];
    return activeCollection.taxonIds
      .map((id) => allAnimals.find((a) => a.id === id || a.identity.scientificName === id))
      .filter(Boolean) as AnimalRecord[];
  }, [activeCollection, allAnimals]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const created = await repository.createUserCollection(newColName.trim(), newColDesc.trim(), newColIcon);
    setNewColName('');
    setNewColDesc('');
    setIsCreating(false);
    await refreshCollections();
    setActiveCollectionId(created.id);
  };

  const handleAddTaxon = async (taxonId: string) => {
    if (!activeCollection) return;
    await repository.addTaxonToCollection(activeCollection.id, taxonId);
    await refreshCollections();
    setIsAssigning(false);
  };

  const handleRemoveTaxon = async (taxonId: string) => {
    if (!activeCollection) return;
    await repository.removeTaxonFromCollection(activeCollection.id, taxonId);
    await refreshCollections();
  };

  const getCollectionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'Hourglass':
        return <Hourglass className="w-4 h-4 text-amber-500" />;
      case 'Waves':
        return <Waves className="w-4 h-4 text-sky-500" />;
      default:
        return <Bookmark className="w-4 h-4 text-emerald-500" />;
    }
  };

  const availableToAdd = allAnimals.filter(
    (a) =>
      !activeCollection?.taxonIds?.includes(a.id) &&
      (assignSearchQuery.trim() === '' ||
        a.identity.commonName.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
        a.identity.scientificName.toLowerCase().includes(assignSearchQuery.toLowerCase()))
  );

  return (
    <section className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>THEMATIC RESEARCH COLLECTIONS</span>
          </div>
          <h2 className="text-2xl font-serif font-bold">Curated Cabinet of Curiosities</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Group fauna into ecological themes, living fossil registries, and regional endemism portfolios.
          </p>
        </div>

        <button
          onClick={() => setIsCreating((prev) => !prev)}
          aria-expanded={isCreating}
          aria-label="Create New Thematic Collection"
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Creation Modal / Inline Drawer */}
      {isCreating && (
        <form
          onSubmit={handleCreateCollection}
          role="region"
          aria-label="Create Thematic Collection Form"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsCreating(false);
          }}
          className="bg-slate-50 dark:bg-[#0B0F0E] border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-lg animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg">Create Thematic Collection</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              aria-label="Cancel and close form"
              className="p-1 rounded-lg text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Collection Name *
              </label>
              <input
                type="text"
                required
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="e.g. Sri Lankan Endemics, Deep Sea Giants..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Icon Theme
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'Bookmark', label: 'Bookmark' },
                  { id: 'Flame', label: 'Apex / Flame' },
                  { id: 'Hourglass', label: 'Fossil / Ancient' },
                  { id: 'Waves', label: 'Marine / Oceanic' }
                ].map((ic) => (
                  <button
                    type="button"
                    key={ic.id}
                    onClick={() => setNewColIcon(ic.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono border flex items-center gap-1.5 ${
                      newColIcon === ic.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-500 font-semibold'
                        : 'bg-white dark:bg-[#121917] border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    {getCollectionIcon(ic.id)}
                    <span>{ic.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              Description & Research Goals
            </label>
            <input
              type="text"
              value={newColDesc}
              onChange={(e) => setNewColDesc(e.target.value)}
              placeholder="e.g. Highlighting evolutionary adaptations and threat assessments..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-semibold text-xs shadow hover:bg-amber-400"
            >
              Save Collection
            </button>
          </div>
        </form>
      )}

      {/* Collection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {collections.map((col) => {
          const isActive = col.id === activeCollection?.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveCollectionId(col.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 border whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold shadow-md'
                  : 'bg-white dark:bg-[#121917] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
              }`}
            >
              {getCollectionIcon(col.icon_name)}
              <span>{col.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {col.taxonIds?.length || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Collection Header & Actions */}
      {activeCollection && (
        <div className="bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xl">{activeCollection.name}</span>
              <span className="text-[11px] font-mono text-slate-400">
                ({collectionSpecies.length} species assigned)
              </span>
            </div>
            {activeCollection.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-serif">
                {activeCollection.description}
              </p>
            )}
          </div>

          <button
            onClick={() => setIsAssigning(true)}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Species to Collection</span>
          </button>
        </div>
      )}

      {/* Species Grid for Active Collection */}
      {collectionSpecies.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
          <Compass className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-lg font-serif font-bold">This collection is currently empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Assign verified species from your library to populate this thematic research collection.
          </p>
          <button
            onClick={() => setIsAssigning(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-semibold text-xs shadow"
          >
            Assign First Species
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collectionSpecies.map((animal) => (
            <div key={animal.id} className="relative group">
              <AnimalCard
                animal={animal}
                isFavorite={Boolean(savedAnimalsMap[animal.id])}
                onToggleFavorite={onToggleFavorite}
                isCompared={comparisonIds.includes(animal.id)}
                onToggleCompare={onToggleCompare}
                onSelectAnimal={onSelectAnimal}
              />
              <button
                onClick={() => handleRemoveTaxon(animal.id)}
                className="absolute top-2 right-12 z-20 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-white text-xs transition-colors shadow"
                title="Remove from this collection"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Species Modal */}
      {isAssigning && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsAssigning(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg">Add Species to "{activeCollection?.name}"</h3>
                <p className="text-xs text-slate-400">Select from verified species in the repository</p>
              </div>
              <button onClick={() => setIsAssigning(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <input
                type="text"
                placeholder="Search species name or binomial..."
                value={assignSearchQuery}
                onChange={(e) => setAssignSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {availableToAdd.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No matching species found.
                </div>
              ) : (
                availableToAdd.slice(0, 30).map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                        {a.media?.url && (
                          <img
                            src={a.media.thumbnailUrl || a.media.url}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{a.identity.commonName}</div>
                        <div className="text-[11px] font-serif italic text-slate-400">
                          {a.identity.scientificName} · {a.identity.categoryGroup}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddTaxon(a.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
