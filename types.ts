
export interface RubricDescription {
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
}

export interface ObservationCriteria {
  id: string;
  label: string;
  rubrics: RubricDescription;
}

export interface ObservationSection {
  id: string;
  title: string;
  weight: number; // Percentage (e.g., 40, 20)
  criteria: ObservationCriteria[];
}

export interface MediaFile {
  data: string; // Base64
  mimeType: string;
  name: string;
}

export interface EvaluationData {
  id?: string; // Unique ID for persistence
  timestamp?: number;
  observerName: string;
  teacherName: string;
  subject: string;
  topic: string;
  classGrade: string;
  ratings: Record<string, number>; // id -> score (1-5)
  comment: string;
  videoData?: MediaFile | null;
  audioData?: MediaFile | null;
}

export interface AIAnalysisResult {
  summary: string;
  sentiment: 'Yüksək' | 'Orta' | 'Aşağı';
  score: number; // Calculated weighted score
  categoryScores: Record<string, number>; // Breakdown by category
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface SavedEvaluation extends EvaluationData {
  id: string;
  timestamp: number;
  result: AIAnalysisResult;
}

export enum AppState {
  FORM = 'FORM',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  HISTORY = 'HISTORY',
  ERROR = 'ERROR'
}

export const OBSERVATION_FORM_STRUCTURE: ObservationSection[] = [
  {
    id: 'planning_instruction',
    title: 'Dərsin planlaşdırılması və tədris prosesi',
    weight: 40,
    criteria: [
      {
        id: '1.1',
        label: '1.1 Təlim nəticələrinin düzgün müəyyən edilməsi',
        rubrics: {
          5: 'Təlim nəticələri tam və aydın şəkildə müəyyən edilib, dərsin hər bir mərhələsində tətbiq olunur.',
          4: 'Təlim nəticələri aydın şəkildə müəyyən edilib və dərsin mərhələlərinə inteqrasiya olunub.',
          3: 'Təlim nəticələri müəyyən edilib, lakin onların dərs zamanı tətbiqi qeyri-sabitdir.',
          2: 'Təlim nəticələri qismən müəyyən edilib, lakin onlar dərs prosesi ilə tam uyğunlaşdırılmayıb.',
          1: 'Təlim nəticələri ümumiyyətlə müəyyən edilməyib və dərs prosesi ilə əlaqələndirilmir.'
        }
      },
      {
        id: '1.2',
        label: '1.2 Təlim nəticələrinin şagirdlərlə aydın şəkildə paylaşılması',
        rubrics: {
          5: 'Təlim nəticələri həmişə şagirdlərlə aydın və sistemli şəkildə paylaşılır. Şagirdlər nəticələri tam anlayır.',
          4: 'Təlim nəticələri şagirdlərlə demək olar ki, hər zaman aydın şəkildə paylaşılır.',
          3: 'Təlim nəticələri şagirdlərə təqdim olunur, lakin onların izahı hər zaman aydın deyil.',
          2: 'Təlim nəticələri qismən şagirdlərlə paylaşılır, lakin aydın deyil.',
          1: 'Təlim nəticələri şagirdlərlə ümumiyyətlə paylaşılmır.'
        }
      },
      {
        id: '1.3',
        label: '1.3 Dərs planlaşdırılarkən şagirdlərin əvvəlki təlim nəticələrinin nəzərə alınması',
        rubrics: {
          5: 'Dərs planlaşdırılarkən şagirdlərin əvvəlki təlim nəticələri tam nəzərə alınır.',
          4: 'Dərs planlaşdırılarkən əksər şagirdlərin əvvəlki təlim nəticələri nəzərə alınır.',
          3: 'Dərs planlaşdırılarkən şagirdlərin əvvəlki təlim nəticələri nəzərə alınır, lakin bu yanaşma davamlı deyil.',
          2: 'Dərs planlaşdırılarkən yalnız bəzi şagirdlərin əvvəlki təlim nəticələri nəzərə alınır.',
          1: 'Dərs planlaşdırılarkən şagirdlərin əvvəlki təlim nəticələri nəzərə alınmır.'
        }
      },
      {
        id: '1.4',
        label: '1.4 Fərdi öyrənmə ehtiyaclarının nəzərə alınması',
        rubrics: {
          5: 'Hər bir şagirdin fərdi öyrənmə ehtiyacları tam dəqiqliklə müəyyən edilir və nəzərə alınır.',
          4: 'Şagirdlərin fərdi öyrənmə ehtiyacları adətən müəyyən olunur və dərsin əsas hissələrində nəzərə alınır.',
          3: 'Fərdi öyrənmə ehtiyacları bəzi hallarda müəyyən edilir, lakin dərsin ümumi planında hər zaman nəzərə alınmır.',
          2: 'Şagirdlərin fərdi öyrənmə ehtiyacları çox az hallarda müəyyən edilir.',
          1: 'Fərdi öyrənmə ehtiyacları ümumiyyətlə müəyyən edilmir.'
        }
      },
      {
        id: '1.5',
        label: '1.5 Vaxtdan səmərəli istifadə',
        rubrics: {
          5: 'Dərsin bütün mərhələləri dəqiq vaxt çərçivəsində planlaşdırılmışdır və zaman maksimum effektivliklə istifadə olunur.',
          4: 'Vaxtın istifadəsi əsasən səmərəli planlaşdırılıb, nəticələrə çatılır.',
          3: 'Vaxtın istifadəsi bəzən nəzərə alınır, digər hissələrdə vaxt itkisi olur.',
          2: 'Dərsin vaxtı nadir hallarda səmərəli planlaşdırılır.',
          1: 'Dərsin vaxtı ümumiyyətlə səmərəli planlaşdırılmır.'
        }
      },
      {
        id: '1.6',
        label: '1.6 Resurslardan səmərəli istifadə',
        rubrics: {
          5: 'Resurslar dərsin bütün mərhələlərində dəqiq və məqsədəuyğun şəkildə planlaşdırılır.',
          4: 'Resurslar adətən dərsin əksər hissələri üçün məqsədəuyğun planlaşdırılır.',
          3: 'Resursların istifadəsi bəzən planlaşdırılır.',
          2: 'Resurslar nadir hallarda məqsədəuyğun planlaşdırılır.',
          1: 'Resurslardan ümumiyyətlə məqsədəuyğun istifadə planlaşdırılmır.'
        }
      },
      {
        id: '1.7',
        label: '1.7 Təlim nəticələrinə xidmət edən üsul və formaların tətbiqi',
        rubrics: {
          5: 'Təlim üsul və formaları mükəmməl tətbiq edilir və təlim nəticələrinə tam xidmət edir.',
          4: 'Təlim üsul və formaları təlim nəticələrinə uyğun tətbiq edilir.',
          3: 'Təlim üsulları tətbiq olunur, lakin bəzən təlim nəticələrinə tam xidmət etmir.',
          2: 'Təlim üsulları qismən tətbiq edilir, lakin təlim nəticələrinə uyğun deyil.',
          1: 'Təlim üsul və formaları düzgün seçilmir.'
        }
      },
      {
        id: '1.8',
        label: '1.8 Dərsin mərhələləri və məzmun əlaqəliliyi',
        rubrics: {
          5: 'Dərsin mərhələləri və məzmun arasında tam məntiqli ardıcıllıq mövcuddur.',
          4: 'Dərsin mərhələləri arasında məzmun əlaqəliliyi təmin edilir.',
          3: 'Dərsin mərhələləri arasında müəyyən əlaqə var, lakin ardıcıllıq tam təmin olunmur.',
          2: 'Dərsin mərhələləri arasında əlaqə zəifdir.',
          1: 'Dərsin mərhələləri arasındakı əlaqə tamamilə pozulmuşdur.'
        }
      },
      {
        id: '1.9',
        label: '1.9 Məzmunun aydın şəkildə izah edilməsi',
        rubrics: {
          5: 'Məzmun tam aydın və sistemli şəkildə izah edilir, şagirdlər tam başa düşür.',
          4: 'Məzmun aydın və başa düşülən şəkildə izah edilir.',
          3: 'Məzmun izah olunur, lakin bəzi hissələr aydın deyil.',
          2: 'Məzmun izah olunur, lakin çox qarışıq və qeyri-aydındır.',
          1: 'Məzmun izah edilmir və ya şagirdlərin başa düşməsi üçün aydın deyil.'
        }
      },
      {
        id: '1.10',
        label: '1.10 Şagirdlərin müstəqil işləməsinə şərait yaradılması',
        rubrics: {
          5: 'Şagirdlərin müstəqil işləməsi üçün hər zaman şərait yaradılır və dəstəklənir.',
          4: 'Şagirdlərə müstəqil işləmək üçün şərait adətən təmin edilir.',
          3: 'Şagirdlərin müstəqil işləməsinə qismən şərait yaradılır.',
          2: 'Şagirdlərin müstəqil işləməsi üçün şərait az hallarda təmin edilir.',
          1: 'Şagirdlərə müstəqil işləmək üçün heç bir şərait yaradılmır.'
        }
      },
      {
        id: '1.11',
        label: '1.11 Şagirdlərin dərsə fəal cəlb olunmasının təmin edilməsi',
        rubrics: {
          5: 'Şagirdlərin dərsə tam fəal cəlb olunması təmin edilir və onlar motivasiya olunmuşdur.',
          4: 'Şagirdlərin dərsə fəal cəlb olunması adətən təmin edilir.',
          3: 'Şagirdlər dərsə qismən cəlb olunur, lakin tam fəallıq təmin edilmir.',
          2: 'Şagirdlərin dərsə cəlb olunması az hallarda müşahidə edilir.',
          1: 'Şagirdlərin dərsə cəlb olunması təmin edilmir, onlar tam passivdir.'
        }
      }
    ]
  },
  {
    id: 'environment',
    title: 'Təlim mühiti',
    weight: 20,
    criteria: [
      {
        id: '2.1',
        label: '2.1 Şagirdlərin nümunəvi davranış nümayiş etdirmələri',
        rubrics: {
          5: 'Bütün şagirdlər nümunəvi davranış nümayiş etdirir və dərsdə tam intizam təmin edilir.',
          4: 'Şagirdlərin əksəriyyəti nümunəvi davranış nümayiş etdirir, intizam qorunur.',
          3: 'Şagirdlər bəzən nümunəvi davranış nümayiş etdirir, lakin tam intizam müşahidə olunmur.',
          2: 'Şagirdlər nadir hallarda nümunəvi davranış göstərir.',
          1: 'Şagirdlər nümunəvi davranış nümayiş etdirmir, dərsdə intizam pozuntuları çoxdur.'
        }
      },
      {
        id: '2.2',
        label: '2.2 Davranış qaydalarının pozulma halları',
        rubrics: {
          5: 'Davranış qaydaları həmişə ciddi şəkildə qorunur və dərs mühiti sakit və nizamlıdır.',
          4: 'Davranış qaydaları əsasən pozulmur, yalnız nadir hallarda kiçik pozuntular olur.',
          3: 'Qaydaların pozulması bəzən müşahidə olunur, lakin müəllim müdaxilə edir.',
          2: 'Davranış qaydalarının pozulması az hallarda müşahidə olunur, lakin dərsə təsir edir.',
          1: 'Davranış qaydaları daim pozulur, müəllimin müdaxiləsi tələb olunur.'
        }
      },
      {
        id: '2.3',
        label: '2.3 Şagirdlərin təlimatlara əməl etməsi',
        rubrics: {
          5: 'Şagirdlər həmişə təlimatlara əməl edir və dərsin gedişatı problemsiz davam edir.',
          4: 'Şagirdlər adətən təlimatlara əməl edir və tapşırıqları yerinə yetirir.',
          3: 'Şagirdlər təlimatlara bəzən əməl edir, bəzi hallarda təlimatlar anlaşılmır.',
          2: 'Şagirdlər təlimatlara nadir hallarda əməl edir.',
          1: 'Şagirdlər təlimatlara ümumiyyətlə əməl etmir, dərsin gedişatı pozulur.'
        }
      },
      {
        id: '2.4',
        label: '2.4 Şagirdlər arasında nəzakət və qayğıkeş münasibət',
        rubrics: {
          5: 'Şagirdlər həmişə bir-birlərinə nəzakət və qayğıkeş münasibət göstərir.',
          4: 'Şagirdlər adətən bir-birinə nəzakətli və qayğıkeş davranır.',
          3: 'Şagirdlər arasında bəzən nəzakət və qayğıkeş münasibət müşahidə olunur.',
          2: 'Şagirdlər arasında nəzakət nadir hallarda müşahidə olunur, qarşılıqlı hörmətsizlik var.',
          1: 'Şagirdlər arasında nəzakət və qayğıkeş münasibət yoxdur.'
        }
      },
      {
        id: '2.5',
        label: '2.5 Müəllimin təmin etdiyi ünsiyyət və əməkdaşlıq mühiti',
        rubrics: {
          5: 'Müəllim həmişə şagirdlərlə mükəmməl ünsiyyət və əməkdaşlıq mühiti yaradır.',
          4: 'Müəllim adətən səmimi və dəstəkləyici ünsiyyət mühiti yaradır.',
          3: 'Müəllim bəzən ünsiyyət və əməkdaşlıq mühiti yaradır.',
          2: 'Müəllim nadir hallarda ünsiyyət və əməkdaşlıq mühiti yaradır.',
          1: 'Müəllim şagirdlərlə əməkdaşlıq mühiti yaratmır.'
        }
      }
    ]
  },
  {
    id: 'outcomes',
    title: 'Şagirdlərin bacarıq və nəticələri',
    weight: 20,
    criteria: [
      {
        id: '3.1',
        label: '3.1 Şagirdlərin nəzərdə tutulan məzmun standartlarına uyğun irəliləyiş nümayiş etdirməsi',
        rubrics: {
          5: 'Şagirdlər həmişə nəzərdə tutulan məzmun standartlarına uyğun irəliləyiş nümayiş etdirir.',
          4: 'Şagirdlər adətən məzmun standartlarına uyğun irəliləyiş nümayiş etdirir.',
          3: 'Şagirdlər bəzi hallarda məzmun standartlarına uyğun irəliləyiş nümayiş etdirir.',
          2: 'Şagirdlər nadir hallarda məzmun standartlarına uyğun irəliləyiş nümayiş etdirir.',
          1: 'Şagirdlər məzmun standartlarına uyğun irəliləyiş nümayiş etdirmir.'
        }
      },
      {
        id: '3.2',
        label: '3.2 Şagirdlərin öyrəndiklərini müstəqil şəkildə əlaqələndirmə bacarıqları',
        rubrics: {
          5: 'Şagirdlər həmişə öyrəndiklərini müstəqil şəkildə əlaqələndirir və fikirlərini əsaslandırır.',
          4: 'Şagirdlər adətən öyrəndiklərini əlaqələndirir və fikirlərini əsaslandırır.',
          3: 'Şagirdlər bəzi hallarda öyrəndiklərini əlaqələndirir.',
          2: 'Şagirdlər nadir hallarda öyrəndiklərini əlaqələndirir.',
          1: 'Şagirdlər öyrəndiklərini ümumiyyətlə əlaqələndirmir.'
        }
      },
      {
        id: '3.3',
        label: '3.3 Tənqidi və yaradıcı düşünmə bacarıqları',
        rubrics: {
          5: 'Şagirdlər həmişə tənqidi və yaradıcı düşünmə bacarıqları nümayiş etdirir.',
          4: 'Şagirdlər adətən tənqidi və yaradıcı düşünmə bacarıqları nümayiş etdirir.',
          3: 'Şagirdlər bəzən tənqidi və yaradıcı düşünmə bacarıqları nümayiş etdirir.',
          2: 'Şagirdlər nadir hallarda tənqidi və yaradıcı düşünmə bacarıqları nümayiş etdirir.',
          1: 'Şagirdlər tənqidi və yaradıcı düşünmə bacarıqları nümayiş etdirmir.'
        }
      }
    ]
  },
  {
    id: 'assessment',
    title: 'Qiymətləndirmə və rəy',
    weight: 20,
    criteria: [
      {
        id: '4.1',
        label: '4.1 Dərs zamanı qiymətləndirmə üsullarının təlim nəticələrinə uyğunluğu',
        rubrics: {
          5: 'Qiymətləndirmə üsulları həmişə təlim nəticələrinə tam uyğun gəlir və dərsin məqsədini dəstəkləyir.',
          4: 'Qiymətləndirmə üsulları təlim nəticələrinə əsasən uyğun seçilir.',
          3: 'Qiymətləndirmə üsulları bəzən təlim nəticələrinə uyğun olur.',
          2: 'Qiymətləndirmə üsulları nadir hallarda təlim nəticələrinə uyğun gəlir.',
          1: 'Qiymətləndirmə üsulları təlim nəticələrinə ümumiyyətlə uyğun deyil.'
        }
      },
      {
        id: '4.2',
        label: '4.2 Şagirdlərə faydalı və fərdi rəy verilməsi',
        rubrics: {
          5: 'Şagirdlərə həmişə faydalı, fərdi və məqsədyönlü rəy verilir.',
          4: 'Şagirdlərə adətən faydalı və fərdi rəy verilir.',
          3: 'Şagirdlərə bəzən rəy verilir, lakin bu rəy konkret və fərdi olmur.',
          2: 'Rəy nadir hallarda verilir.',
          1: 'Şagirdlərə ümumiyyətlə rəy verilmir.'
        }
      },
      {
        id: '4.3',
        label: '4.3 Şagirdlərin özünüqiymətləndirməsi və qarşılıqlı qiymətləndirmə',
        rubrics: {
          5: 'Şagirdlər həmişə özlərini və bir-birlərini qiymətləndirmək üçün şəraitə malikdir.',
          4: 'Şagirdlər adətən özlərini və bir-birlərini qiymətləndirir.',
          3: 'Şagirdlər bəzən özlərini qiymətləndirir.',
          2: 'Özünüqiymətləndirmə nadir hallarda tətbiq olunur.',
          1: 'Şagirdlərin özünüqiymətləndirmə imkanları ümumiyyətlə yaradılmır.'
        }
      }
    ]
  }
];
