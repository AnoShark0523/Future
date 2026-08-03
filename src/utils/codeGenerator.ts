/**
 * 代码生成器 - 为代码速度练习生成随机代码
 * 支持多语言、多难度
 */

// 支持的语言
export type PracticeLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'c'
  | 'go'
  | 'rust'

// 难度等级
export type Difficulty = 'iron' | 'stone' | 'diamond' | 'african'

export interface DifficultyInfo {
  id: Difficulty
  name: string
  icon: string
  color: string
  description: string
  lineRange: [number, number]
  timeLimit: number // 建议时间(秒)
}

export const difficulties: DifficultyInfo[] = [
  {
    id: 'iron',
    name: '废铁',
    icon: '🔩',
    color: '#95a5a6',
    description: '基础语法，5-10行代码',
    lineRange: [5, 10],
    timeLimit: 75
  },
  {
    id: 'stone',
    name: '原石',
    icon: '💎',
    color: '#3498db',
    description: '中等难度，10-20行代码',
    lineRange: [10, 20],
    timeLimit: 120
  },
  {
    id: 'diamond',
    name: '钻石',
    icon: '💠',
    color: '#9b59b6',
    description: '高等难度，20-35行代码',
    lineRange: [20, 35],
    timeLimit: 210
  },
  {
    id: 'african',
    name: '非洲之心',
    icon: '❤️',
    color: '#e74c3c',
    description: '地狱难度，35-55行代码',
    lineRange: [35, 55],
    timeLimit: 330
  }
]

export interface LanguageInfo {
  id: PracticeLanguage
  name: string
  icon: string
  codemirrorMode: string
}

export const languages: LanguageInfo[] = [
  { id: 'javascript', name: 'JavaScript', icon: '📜', codemirrorMode: 'javascript' },
  { id: 'typescript', name: 'TypeScript', icon: '📘', codemirrorMode: 'javascript' },
  { id: 'python', name: 'Python', icon: '🐍', codemirrorMode: 'python' },
  { id: 'java', name: 'Java', icon: '☕', codemirrorMode: 'clike' },
  { id: 'cpp', name: 'C++', icon: '🟣', codemirrorMode: 'cpp' },
  { id: 'c', name: 'C', icon: '🔵', codemirrorMode: 'clike' },
  { id: 'go', name: 'Go', icon: '🐹', codemirrorMode: 'go' },
  { id: 'rust', name: 'Rust', icon: '⚙️', codemirrorMode: 'rust' }
]

// ==================== 随机辅助函数 ====================

const varNames = ['data', 'value', 'result', 'count', 'index', 'item', 'temp', 'num', 'sum', 'max', 'min', 'total', 'current', 'prev', 'next', 'first', 'last', 'target', 'source', 'dest']
const funcNames = ['process', 'calculate', 'handle', 'compute', 'analyze', 'transform', 'validate', 'convert', 'parse', 'format', 'generate', 'execute', 'resolve', 'fetch', 'update']
const classNames = ['UserService', 'DataHandler', 'TaskManager', 'CacheStore', 'EventBus', 'ConfigLoader', 'StateManager', 'RequestParser', 'ResponseBuilder', 'Logger']
const methodNames = ['getData', 'setData', 'process', 'validate', 'convert', 'parse', 'format', 'execute', 'resolve', 'update', 'fetch', 'save', 'load', 'clear', 'check']

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randVar(): string {
  return rand(varNames)
}

function randFunc(): string {
  return rand(funcNames)
}

function randClass(): string {
  return rand(classNames)
}

function randMethod(): string {
  return rand(methodNames)
}

function randNum(): number {
  return randInt(1, 100)
}

// ==================== JavaScript 代码模板 ====================

function genJavaScript(difficulty: Difficulty): string {
  const templates: Record<Difficulty, (() => string)[]> = {
    iron: [
      () => `const ${randVar()} = ${randNum()};
let ${randVar()} = ${randVar()} * 2;
if (${randVar()} > ${randNum()}) {
  console.log(${randVar()});
} else {
  console.log('low');
}`,
      () => {
        const fnName = randFunc()
        return `function ${fnName}(a, b) {
  return a + b;
}
const ${randVar()} = ${fnName}(${randNum()}, ${randNum()});
console.log(${randVar()});`
      },
      () => `const ${randVar()} = [${randNum()}, ${randNum()}, ${randNum()}];
${randVar()}.forEach(n => {
  console.log(n * 2);
});`,
      () => `let ${randVar()} = ${randNum()};
while (${randVar()} > 0) {
  ${randVar()}--;
  console.log(${randVar()});
}`,
      () => `const ${randVar()} = { name: 'test', value: ${randNum()} };
if (${randVar()}.value > 50) {
  ${randVar()}.status = 'high';
} else {
  ${randVar()}.status = 'low';
}`
    ],
    stone: [
      () => {
        const fnName = randFunc()
        return `function ${fnName}(arr) {
  let ${randVar()} = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > ${randNum()}) {
      ${randVar()} += arr[i];
    }
  }
  return ${randVar()};
}
const ${randVar()} = [${randNum()}, ${randNum()}, ${randNum()}, ${randNum()}];
const ${randVar()} = ${fnName}(${randVar()});
console.log('Result:', ${randVar()});`
      },
      () => {
        const className = randClass()
        const countMethod = randMethod()
        return `class ${className} {
  constructor(name) {
    this.name = name;
    this.data = [];
  }
  add(item) {
    this.data.push(item);
  }
  ${countMethod}() {
    return this.data.length;
  }
}
const ${randVar()} = new ${className}('test');
${randVar()}.add(${randNum()});
${randVar()}.add(${randNum()});
console.log(${randVar()}.${countMethod}());`
      },
      () => {
        const objVar = randVar()
        const filteredVar = randVar()
        const mappedVar = randVar()
        return `const ${objVar} = {
  items: [${randNum()}, ${randNum()}, ${randNum()}],
  filter(min) {
    return this.items.filter(n => n >= min);
  },
  map(fn) {
    return this.items.map(fn);
  }
};
const ${filteredVar} = ${objVar}.filter(${randNum()});
const ${mappedVar} = ${objVar}.map(n => n * 2);
console.log(${filteredVar});
console.log(${mappedVar});`
      }
    ],
    diamond: [
      () => {
        const className = randClass()
        const setMethod = randMethod()
        const getAllMethod = randMethod()
        const filterMethod = randMethod()
        return `class ${className} {
  constructor() {
    this.cache = new Map();
    this.count = 0;
  }
  ${setMethod}(key, value) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    this.count++;
    this.cache.set(key, value);
    return value;
  }
  ${getAllMethod}() {
    const ${randVar()} = [];
    for (const [k, v] of this.cache.entries()) {
      ${randVar()}.push({ key: k, value: v });
    }
    return ${randVar()};
  }
  ${filterMethod}(predicate) {
    return this.${getAllMethod}().filter(predicate);
  }
}
const ${randVar()} = new ${className}();
${randVar()}.${setMethod}('a', ${randNum()});
${randVar()}.${setMethod}('b', ${randNum()});
const ${randVar()} = ${randVar()}.${filterMethod}(item => item.value > ${randNum()});
console.log(${randVar()});`
      },
      () => {
        const fetchFn = randFunc()
        const processFn = randFunc()
        return `async function ${fetchFn}(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed:', error.message);
    return null;
  }
}
function ${processFn}(items) {
  return items
    .filter(item => item.active)
    .map(item => ({
      id: item.id,
      name: item.name.toUpperCase(),
      score: item.score * 2
    }))
    .sort((a, b) => b.score - a.score);
}
const ${randVar()} = [
  { id: 1, name: 'foo', active: true, score: ${randNum()} },
  { id: 2, name: 'bar', active: false, score: ${randNum()} },
  { id: 3, name: 'baz', active: true, score: ${randNum()} }
];
const ${randVar()} = ${processFn}(${randVar()});
console.log(${randVar()});`
      }
    ],
    african: [
      () => {
        const className = randClass()
        const setMethod = randMethod()
        const getMethod = randMethod()
        const removeMethod = randMethod()
        const getHistoryMethod = randMethod()
        const filterMethod = randMethod()
        const statsMethod = randMethod()
        return `class ${className} {
  constructor(config) {
    this.config = { ...config };
    this.state = new Map();
    this.listeners = new Set();
    this.history = [];
    this.middleware = [];
  }
  use(middleware) {
    this.middleware.push(middleware);
    return this;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  ${setMethod}(key, value) {
    const oldValue = this.state.get(key);
    const newValue = this.middleware.reduce(
      (v, mw) => mw(key, v, oldValue),
      value
    );
    this.state.set(key, newValue);
    this.history.push({ key, oldValue, newValue, timestamp: Date.now() });
    this.listeners.forEach(fn => fn(key, newValue, oldValue));
    return this;
  }
  ${getMethod}(key) {
    return this.state.get(key);
  }
  ${removeMethod}(key) {
    const value = this.state.get(key);
    this.state.delete(key);
    return value;
  }
  ${getHistoryMethod}() {
    return this.history.slice(-10);
  }
  ${filterMethod}(predicate) {
    const result = [];
    for (const [key, value] of this.state.entries()) {
      if (predicate(key, value)) {
        result.push({ key, value });
      }
    }
    return result;
  }
  ${statsMethod}() {
    return {
      size: this.state.size,
      listeners: this.listeners.size,
      history: this.history.length,
      middleware: this.middleware.length
    };
  }
}
const ${randVar()} = new ${className}({ debug: true });
${randVar()}.use((key, value) => typeof value === 'number' ? value * 2 : value);
${randVar()}.subscribe((key, newValue) => console.log(key, newValue));
${randVar()}.${setMethod}('count', ${randNum()});
${randVar()}.${setMethod}('name', 'test');
const ${randVar()} = ${randVar()}.${statsMethod}();
console.log(${randVar()});`
      }
    ]
  }

  return rand(templates[difficulty])()
}

// ==================== TypeScript 代码模板 ====================

function genTypeScript(difficulty: Difficulty): string {
  const templates: Record<Difficulty, (() => string)[]> = {
    iron: [
      () => `const ${randVar()}: number = ${randNum()};
let ${randVar()}: string = 'hello';
function add(a: number, b: number): number {
  return a + b;
}
console.log(add(${randVar()}, ${randNum()}));`,
      () => `interface User {
  id: number;
  name: string;
}
const ${randVar()}: User = {
  id: ${randNum()},
  name: 'test'
};
console.log(${randVar()}.name);`
    ],
    stone: [
      () => {
        const className = randClass()
        return `interface Repository<T> {
  items: T[];
  add(item: T): void;
  getAll(): T[];
}
class ${className}<T> implements Repository<T> {
  items: T[] = [];
  add(item: T): void {
    this.items.push(item);
  }
  getAll(): T[] {
    return [...this.items];
  }
}
const ${randVar()} = new ${className}<number>();
${randVar()}.add(${randNum()});
${randVar()}.add(${randNum()});
console.log(${randVar()}.getAll());`
      },
      () => {
        const fnName = randFunc()
        return `type Status = 'active' | 'inactive' | 'pending';
interface Task {
  id: number;
  name: string;
  status: Status;
}
function ${fnName}(tasks: Task[]): Task[] {
  return tasks.filter(t => t.status === 'active');
}
const ${randVar()}: Task[] = [
  { id: 1, name: 'A', status: 'active' },
  { id: 2, name: 'B', status: 'inactive' }
];
console.log(${fnName}(${randVar()}));`
      }
    ],
    diamond: [
      () => {
        const baseClass = randClass()
        const getAllMethod = randMethod()
        return `abstract class ${baseClass}<T> {
  protected data: T[] = [];
  abstract validate(item: T): boolean;
  add(item: T): boolean {
    if (!this.validate(item)) return false;
    this.data.push(item);
    return true;
  }
  remove(predicate: (item: T) => boolean): T[] {
    const removed: T[] = [];
    this.data = this.data.filter(item => {
      if (predicate(item)) {
        removed.push(item);
        return false;
      }
      return true;
    });
    return removed;
  }
  ${getAllMethod}(): T[] {
    return [...this.data];
  }
}
interface User {
  id: number;
  name: string;
  age: number;
}
class UserStore extends ${baseClass}<User> {
  validate(user: User): boolean {
    return user.id > 0 && user.name.length > 0 && user.age >= 0;
  }
  findByAge(min: number): User[] {
    return this.data.filter(u => u.age >= min);
  }
}
const ${randVar()} = new UserStore();
${randVar()}.add({ id: 1, name: 'Alice', age: ${randNum()} });
${randVar()}.add({ id: 2, name: 'Bob', age: ${randNum()} });
console.log(${randVar()}.${getAllMethod}());
console.log(${randVar()}.findByAge(20));`
      }
    ],
    african: [
      () => {
        const className = randClass()
        const countMethod = randMethod()
        const removeMethod = randMethod()
        const removeVar = randVar()
        return `type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
interface Pipeline<T> {
  execute(input: T): Promise<Result<T>>;
}
class ${className}<T> implements Pipeline<T> {
  private steps: Array<(data: T) => Promise<T>> = [];
  private retries: number;
  private logger?: (msg: string) => void;
  constructor(retries: number = 3) {
    this.retries = retries;
  }
  use(step: (data: T) => Promise<T>): this {
    this.steps.push(step);
    return this;
  }
  setLogger(fn: (msg: string) => void): this {
    this.logger = fn;
    return this;
  }
  async execute(input: T): Promise<Result<T>> {
    let data = input;
    for (const step of this.steps) {
      let attempts = 0;
      while (attempts < this.retries) {
        try {
          data = await step(data);
          break;
        } catch (e) {
          attempts++;
          this.logger?.(\`Step failed (\${attempts}/\${this.retries}): \${e}\`);
          if (attempts >= this.retries) {
            return { success: false, error: e as Error };
          }
        }
      }
    }
    return { success: true, data };
  }
  ${countMethod}(): number {
    return this.steps.length;
  }
  ${removeMethod}(name: string): boolean {
    const ${removeVar} = this.steps.length;
    this.steps = this.steps.filter((s, i) => i !== ${removeVar} - 1);
    return this.steps.length < ${removeVar};
  }
}
interface DataItem {
  id: number;
  value: string;
}
async function main() {
  const pipeline = new ${className}<DataItem>(2);
  pipeline.setLogger(msg => console.log('[LOG]', msg));
  pipeline.use(async data => ({ ...data, value: data.value.toUpperCase() }));
  pipeline.use(async data => ({ ...data, id: data.id * 10 }));
  const ${randVar()} = await pipeline.execute({
    id: ${randNum()},
    value: 'test'
  });
  console.log(${randVar()});
}
main();`
      }
    ]
  }
  return rand(templates[difficulty])()
}

// ==================== Python 代码模板 ====================

function genPython(difficulty: Difficulty): string {
  const templates: Record<Difficulty, (() => string)[]> = {
    iron: [
      () => `${randVar()} = ${randNum()}
${randVar()} = ${randVar()} * 2
if ${randVar()} > ${randNum()}:
    print(${randVar()})
else:
    print("low")`,
      () => `def ${randFunc()}(a, b):
    return a + b
${randVar()} = ${randFunc()}(${randNum()}, ${randNum()})
print(${randVar()})`,
      () => `${randVar()} = [${randNum()}, ${randNum()}, ${randNum()}]
for n in ${randVar()}:
    print(n * 2)`
    ],
    stone: [
      () => {
        const className = randClass()
        const countMethod = randMethod().toLowerCase()
        return `class ${className}:
    def __init__(self, name):
        self.name = name
        self.data = []
    def add(self, item):
        self.data.append(item)
    def ${countMethod}(self):
        return len(self.data)
${randVar()} = ${className}("test")
${randVar()}.add(${randNum()})
${randVar()}.add(${randNum()})
print(${randVar()}.${countMethod}())`
      },
      () => {
        const fnName = randFunc()
        return `def ${fnName}(items):
    ${randVar()} = 0
    for item in items:
        if item > ${randNum()}:
            ${randVar()} += item
    return ${randVar()}
${randVar()} = [${randNum()}, ${randNum()}, ${randNum()}, ${randNum()}]
${randVar()} = ${fnName}(${randVar()})
print("Result:", ${randVar()})`
      }
    ],
    diamond: [
      () => {
        const className = randClass()
        const setMethod = randMethod().toLowerCase()
        const getAllMethod = randMethod().toLowerCase()
        const filterMethod = randMethod().toLowerCase()
        const statsMethod = randMethod().toLowerCase()
        return `from typing import List, Optional
class ${className}:
    def __init__(self):
        self._cache = {}
        self._count = 0
    def ${setMethod}(self, key: str, value: int) -> int:
        if key in self._cache:
            return self._cache[key]
        self._count += 1
        self._cache[key] = value
        return value
    def ${getAllMethod}(self) -> List[tuple]:
        return list(self._cache.items())
    def ${filterMethod}(self, predicate) -> List[tuple]:
        return [(k, v) for k, v in self._cache.items() if predicate(k, v)]
    def ${statsMethod}(self) -> dict:
        return {
            'size': len(self._cache),
            'count': self._count
        }
${randVar()} = ${className}()
${randVar()}.${setMethod}("a", ${randNum()})
${randVar()}.${setMethod}("b", ${randNum()})
${randVar()} = ${randVar()}.${filterMethod}(lambda k, v: v > ${randNum()})
print(${randVar()})
print(${randVar()}.${statsMethod}())`
      }
    ],
    african: [
      () => {
        const baseClass = randClass()
        const getAllMethod = randMethod().toLowerCase()
        const mapMethod = randMethod().toLowerCase()
        const statsMethod = randMethod().toLowerCase()
        const getHistoryMethod = randMethod().toLowerCase()
        return `from abc import ABC, abstractmethod
from typing import TypeVar, Generic, List, Optional, Callable, Any
T = TypeVar('T')
class ${baseClass}(ABC, Generic[T]):
    def __init__(self):
        self._data: List[T] = []
        self._listeners: List[Callable[[T], None]] = []
        self._history: List[dict] = []
    @abstractmethod
    def validate(self, item: T) -> bool:
        pass
    def subscribe(self, listener: Callable[[T], None]) -> Callable[[], None]:
        self._listeners.append(listener)
        def unsubscribe():
            self._listeners.remove(listener)
        return unsubscribe
    def add(self, item: T) -> bool:
        if not self.validate(item):
            return False
        self._data.append(item)
        self._history.append({
            'action': 'add',
            'item': item,
            'timestamp': len(self._history)
        })
        for listener in self._listeners:
            listener(item)
        return True
    def remove(self, predicate: Callable[[T], bool]) -> List[T]:
        removed = []
        self._data = [x for x in self._data if not (predicate(x) and removed.append(x) is None)]
        return removed
    def ${getAllMethod}(self) -> List[T]:
        return list(self._data)
    def ${mapMethod}(self, fn: Callable[[T], Any]) -> List[Any]:
        return [fn(item) for item in self._data]
    def ${statsMethod}(self) -> dict:
        return {
            'size': len(self._data),
            'listeners': len(self._listeners),
            'history': len(self._history)
        }
    def ${getHistoryMethod}(self, n: int = 10) -> List[dict]:
        return self._history[-n:]
class UserStore(${baseClass}[dict]):
    def validate(self, item: dict) -> bool:
        return 'id' in item and 'name' in item
    def find_by_name(self, name: str) -> Optional[dict]:
        for user in self._data:
            if user.get('name') == name:
                return user
        return None
${randVar()} = UserStore()
${randVar()}.subscribe(lambda u: print(f"Added: {u['name']}"))
${randVar()}.add({'id': 1, 'name': 'Alice', 'age': ${randNum()}})
${randVar()}.add({'id': 2, 'name': 'Bob', 'age': ${randNum()}})
${randVar()} = ${randVar()}.${mapMethod}(lambda u: u['age'] > ${randNum()})
print(${randVar()})
print(${randVar()}.${statsMethod}())`
      }
    ]
  }
  return rand(templates[difficulty])()
}

// ==================== Java 代码模板 ====================

function genJava(difficulty: Difficulty): string {
  const templates: Record<Difficulty, (() => string)[]> = {
    iron: [
      () => `public class Main {
    public static void main(String[] args) {
        int ${randVar()} = ${randNum()};
        if (${randVar()} > 50) {
            System.out.println(${randVar()});
        } else {
            System.out.println("low");
        }
    }
}`,
      () => {
        const fnName = randFunc().substring(0, 1).toUpperCase() + randFunc().slice(1)
        return `public class Main {
    public static int ${fnName}(int a, int b) {
        return a + b;
    }
    public static void main(String[] args) {
        int ${randVar()} = ${fnName}(${randNum()}, ${randNum()});
        System.out.println(${randVar()});
    }
}`
      }
    ],
    stone: [
      () => `import java.util.ArrayList;
import java.util.List;
public class Main {
    public static void main(String[] args) {
        List<Integer> ${randVar()} = new ArrayList<>();
        ${randVar()}.add(${randNum()});
        ${randVar()}.add(${randNum()});
        ${randVar()}.add(${randNum()});
        int ${randVar()} = 0;
        for (int n : ${randVar()}) {
            if (n > ${randNum()}) {
                ${randVar()} += n;
            }
        }
        System.out.println("Result: " + ${randVar()});
    }
}`,
      () => {
        const className = randClass()
        const m1 = randMethod().toLowerCase()
        const m2 = randMethod().toLowerCase()
        const m3 = randMethod().toLowerCase()
        return `import java.util.HashMap;
import java.util.Map;
class ${className} {
    private Map<String, Integer> data = new HashMap<>();
    public void ${m1}(String key, int value) {
        data.put(key, value);
    }
    public int ${m2}(String key) {
        return data.getOrDefault(key, 0);
    }
    public int ${m3}() {
        return data.size();
    }
}
public class Main {
    public static void main(String[] args) {
        ${className} ${randVar()} = new ${className}();
        ${randVar()}.${m1}("a", ${randNum()});
        ${randVar()}.${m1}("b", ${randNum()});
        System.out.println(${randVar()}.${m3}());
    }
}`
      }
    ],
    diamond: [
      () => {
        const baseClass = randClass()
        return `import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;
abstract class ${baseClass}<T> {
    protected List<T> data = new ArrayList<>();
    protected List<String> history = new ArrayList<>();
    public abstract boolean validate(T item);
    public boolean add(T item) {
        if (!validate(item)) return false;
        data.add(item);
        history.add("add: " + item.toString());
        return true;
    }
    public List<T> filter(Predicate<T> predicate) {
        return data.stream()
            .filter(predicate)
            .collect(Collectors.toList());
    }
    public <R> List<R> map(java.util.function.Function<T, R> mapper) {
        return data.stream()
            .map(mapper)
            .collect(Collectors.toList());
    }
    public Optional<T> findFirst(Predicate<T> predicate) {
        return data.stream().filter(predicate).findFirst();
    }
    public Map<String, Object> stats() {
        Map<String, Object> s = new HashMap<>();
        s.put("size", data.size());
        s.put("history", history.size());
        return s;
    }
    public List<String> getHistory() {
        return new ArrayList<>(history);
    }
}
class User {
    int id;
    String name;
    int age;
    User(int id, String name, int age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }
    public String toString() {
        return "User(" + id + ", " + name + ")";
    }
}
class UserStore extends ${baseClass}<User> {
    @Override
    public boolean validate(User user) {
        return user.id > 0 && user.name != null;
    }
    public List<User> findByMinAge(int minAge) {
        return filter(u -> u.age >= minAge);
    }
}
public class Main {
    public static void main(String[] args) {
        UserStore ${randVar()} = new UserStore();
        ${randVar()}.add(new User(1, "Alice", ${randNum()}));
        ${randVar()}.add(new User(2, "Bob", ${randNum()}));
        List<User> ${randVar()} = ${randVar()}.findByMinAge(${randNum()});
        System.out.println(${randVar()});
        System.out.println(${randVar()}.stats());
    }
}`
      }
    ],
    african: [
      () => {
        const ifaceName = randClass()
        const implName = `${ifaceName}Impl`
        return `import java.util.*;
import java.util.concurrent.*;
import java.util.function.*;
interface ${ifaceName}<T> {
    Result<T> process(T input) throws Exception;
    default <R> ${ifaceName}<R> map(Function<T, R> mapper) {
        return input -> {
            Result<T> result = this.process(input);
            if (result.isSuccess()) {
                return Result.success(mapper.apply(result.getData()));
            }
            return Result.failure(result.getError());
        };
    }
}
final class Result<T> {
    private final boolean success;
    private final T data;
    private final String error;
    private Result(boolean success, T data, String error) {
        this.success = success;
        this.data = data;
        this.error = error;
    }
    public static <T> Result<T> success(T data) {
        return new Result<>(true, data, null);
    }
    public static <T> Result<T> failure(String error) {
        return new Result<>(false, null, error);
    }
    public boolean isSuccess() { return success; }
    public T getData() { return data; }
    public String getError() { return error; }
}
class ${implName}<T> implements ${ifaceName}<T> {
    private final List<Function<T, T>> steps = new ArrayList<>();
    private final int maxRetries;
    private Consumer<String> logger = s -> {};
    public ${implName}(int maxRetries) {
        this.maxRetries = maxRetries;
    }
    public ${implName}<T> step(Function<T, T> step) {
        steps.add(step);
        return this;
    }
    public ${implName}<T> logger(Consumer<String> logger) {
        this.logger = logger;
        return this;
    }
    @Override
    public Result<T> process(T input) {
        T data = input;
        for (Function<T, T> step : steps) {
            int attempts = 0;
            while (attempts < maxRetries) {
                try {
                    data = step.apply(data);
                    break;
                } catch (Exception e) {
                    attempts++;
                    logger.accept("Retry " + attempts + "/" + maxRetries + ": " + e.getMessage());
                    if (attempts >= maxRetries) {
                        return Result.failure(e.getMessage());
                    }
                }
            }
        }
        return Result.success(data);
    }
    public int stepCount() { return steps.size(); }
    public Map<String, Object> stats() {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("steps", steps.size());
        s.put("maxRetries", maxRetries);
        return s;
    }
}
public class Main {
    public static void main(String[] args) {
        ${implName}<String> ${randVar()} = new ${implName}<>(3);
        ${randVar()}.logger(s -> System.out.println("[LOG] " + s));
        ${randVar()}.step(s -> s.toUpperCase());
        ${randVar()}.step(s -> s + "!");
        ${randVar()}.step(s -> s.length() > 5 ? s.substring(0, 5) : s);
        Result<String> ${randVar()} = ${randVar()}.process("hello world");
        if (${randVar()}.isSuccess()) {
            System.out.println("OK: " + ${randVar()}.getData());
        } else {
            System.out.println("ERR: " + ${randVar()}.getError());
        }
        System.out.println(${randVar()}.stats());
    }
}`
      }
    ]
  }
  return rand(templates[difficulty])()
}

// ==================== C++ 代码模板 ====================

function genCpp(difficulty: Difficulty): string {
  const templates: Record<Difficulty, (() => string)[]> = {
    iron: [
      () => `#include <iostream>
using namespace std;
int main() {
    int ${randVar()} = ${randNum()};
    if (${randVar()} > 50) {
        cout << ${randVar()} << endl;
    } else {
        cout << "low" << endl;
    }
    return 0;
}`,
      () => {
        const fnName = randFunc()
        return `#include <iostream>
using namespace std;
int ${fnName}(int a, int b) {
    return a + b;
}
int main() {
    int ${randVar()} = ${fnName}(${randNum()}, ${randNum()});
    cout << ${randVar()} << endl;
    return 0;
}`
      }
    ],
    stone: [
      () => `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> ${randVar()} = {${randNum()}, ${randNum()}, ${randNum()}, ${randNum()}};
    int ${randVar()} = 0;
    for (int n : ${randVar()}) {
        if (n > ${randNum()}) {
            ${randVar()} += n;
        }
    }
    cout << "Result: " << ${randVar()} << endl;
    return 0;
}`,
      () => {
        const className = randClass()
        const setMethod = randMethod().toLowerCase()
        const getMethod = randMethod().toLowerCase()
        const sizeMethod = randMethod().toLowerCase()
        return `#include <iostream>
#include <map>
#include <string>
using namespace std;
class ${className} {
private:
    map<string, int> data;
public:
    void ${setMethod}(string key, int value) {
        data[key] = value;
    }
    int ${getMethod}(string key) {
        auto it = data.find(key);
        return it != data.end() ? it->second : 0;
    }
    int ${sizeMethod}() {
        return data.size();
    }
};
int main() {
    ${className} ${randVar()};
    ${randVar()}.${setMethod}("a", ${randNum()});
    ${randVar()}.${setMethod}("b", ${randNum()});
    cout << ${randVar()}.${sizeMethod}() << endl;
    return 0;
}`
      }
    ],
    diamond: [
      () => {
        const baseClass = randClass()
        return `#include <iostream>
#include <vector>
#include <algorithm>
#include <memory>
using namespace std;
template<typename T>
class ${baseClass} {
private:
    vector<T> data;
    vector<string> history;
public:
    virtual bool validate(const T& item) = 0;
    bool add(const T& item) {
        if (!validate(item)) return false;
        data.push_back(item);
        history.push_back("add");
        return true;
    }
    template<typename Pred>
    vector<T> filter(Pred pred) {
        vector<T> result;
        copy_if(data.begin(), data.end(), back_inserter(result), pred);
        return result;
    }
    template<typename Fn>
    auto map(Fn fn) {
        vector<decltype(fn(data[0]))> result;
        transform(data.begin(), data.end(), back_inserter(result), fn);
        return result;
    }
    const vector<T>& getAll() const {
        return data;
    }
    size_t size() const {
        return data.size();
    }
    vector<string> getHistory() const {
        return history;
    }
};
struct User {
    int id;
    string name;
    int age;
};
class UserStore : public ${baseClass}<User> {
public:
    bool validate(const User& u) override {
        return u.id > 0 && !u.name.empty();
    }
    vector<User> findByMinAge(int minAge) {
        return filter([minAge](const User& u) {
            return u.age >= minAge;
        });
    }
};
int main() {
    UserStore ${randVar()};
    ${randVar()}.add({1, "Alice", ${randNum()}});
    ${randVar()}.add({2, "Bob", ${randNum()}});
    auto ${randVar()} = ${randVar()}.findByMinAge(${randNum()});
    cout << "Found: " << ${randVar()}.size() << endl;
    return 0;
}`
      }
    ],
    african: [
      () => {
        const className = randClass()
        const setMethod = randMethod().toLowerCase()
        const getMethod = randMethod().toLowerCase()
        const removeMethod = randMethod().toLowerCase()
        const filterMethod = randMethod().toLowerCase()
        const statsMethod = randMethod().toLowerCase()
        return `#include <iostream>
#include <vector>
#include <map>
#include <memory>
#include <functional>
#include <algorithm>
using namespace std;
template<typename T>
class ${className} {
private:
    map<string, T> state;
    vector<string> history;
    vector<function<T(const string&, const T&, const T*)>> middleware;
    vector<function<void(const string&, const T&, const T*)>> listeners;
public:
    ${className}& use(function<T(const string&, const T&, const T*)> mw) {
        middleware.push_back(mw);
        return *this;
    }
    function<void()> subscribe(function<void(const string&, const T&, const T*)> listener) {
        listeners.push_back(listener);
        return [this, listener]() {
            auto it = find(listeners.begin(), listeners.end(), listener);
            if (it != listeners.end()) listeners.erase(it);
        };
    }
    void ${setMethod}(const string& key, const T& value) {
        const T* oldPtr = state.count(key) ? &state[key] : nullptr;
        T newValue = value;
        for (auto& mw : middleware) {
            newValue = mw(key, newValue, oldPtr);
        }
        state[key] = newValue;
        history.push_back(key);
        for (auto& fn : listeners) {
            fn(key, newValue, oldPtr);
        }
    }
    T ${getMethod}(const string& key, const T& defaultValue = T()) {
        auto it = state.find(key);
        return it != state.end() ? it->second : defaultValue;
    }
    bool ${removeMethod}(const string& key) {
        auto it = state.find(key);
        if (it == state.end()) return false;
        state.erase(it);
        return true;
    }
    vector<string> keys() const {
        vector<string> result;
        for (const auto& p : state) {
            result.push_back(p.first);
        }
        return result;
    }
    template<typename Pred>
    vector<pair<string, T>> ${filterMethod}(Pred pred) {
        vector<pair<string, T>> result;
        for (const auto& p : state) {
            if (pred(p.first, p.second)) {
                result.push_back(p);
            }
        }
        return result;
    }
    map<string, size_t> ${statsMethod}() const {
        map<string, size_t> stats;
        stats["state"] = state.size();
        stats["history"] = history.size();
        stats["listeners"] = listeners.size();
        stats["middleware"] = middleware.size();
        return stats;
    }
    vector<string> getHistory(size_t n = 10) const {
        if (history.size() <= n) return history;
        return vector<string>(history.end() - n, history.end());
    }
};
int main() {
    ${className}<int> ${randVar()};
    ${randVar()}.use([](const string& key, int val, const int* old) {
        return val * 2;
    });
    auto unsub = ${randVar()}.subscribe([](const string& key, int val, const int* old) {
        cout << "Changed " << key << " to " << val << endl;
    });
    ${randVar()}.${setMethod}("count", ${randNum()});
    ${randVar()}.${setMethod}("score", ${randNum()});
    auto ${randVar()} = ${randVar()}.${filterMethod}([](const string& k, int v) {
        return v > ${randNum()};
    });
    for (const auto& p : ${randVar()}) {
        cout << p.first << ": " << p.second << endl;
    }
    auto stats = ${randVar()}.${statsMethod}();
    for (const auto& p : stats) {
        cout << p.first << " = " << p.second << endl;
    }
    return 0;
}`
      }
    ]
  }
  return rand(templates[difficulty])()
}

// ==================== C 代码模板 ====================

function genC(difficulty: Difficulty): string {
  const templates: Record<Difficulty, (() => string)[]> = {
    iron: [
      () => `#include <stdio.h>
int main() {
    int ${randVar()} = ${randNum()};
    if (${randVar()} > 50) {
        printf("%d\\n", ${randVar()});
    } else {
        printf("low\\n");
    }
    return 0;
}`,
      () => {
        const fnName = randFunc()
        return `#include <stdio.h>
int ${fnName}(int a, int b) {
    return a + b;
}
int main() {
    int ${randVar()} = ${fnName}(${randNum()}, ${randNum()});
    printf("%d\\n", ${randVar()});
    return 0;
}`
      }
    ],
    stone: [
      () => `#include <stdio.h>
int main() {
    int ${randVar()}[] = {${randNum()}, ${randNum()}, ${randNum()}, ${randNum()}};
    int ${randVar()} = 0;
    int n = sizeof(${randVar()}) / sizeof(${randVar()}[0]);
    for (int i = 0; i < n; i++) {
        if (${randVar()}[i] > ${randNum()}) {
            ${randVar()} += ${randVar()}[i];
        }
    }
    printf("Result: %d\\n", ${randVar()});
    return 0;
}`,
      () => `#include <stdio.h>
#include <stdlib.h>
typedef struct {
    char name[50];
    int age;
} User;
User* create_user(const char* name, int age) {
    User* u = malloc(sizeof(User));
    snprintf(u->name, sizeof(u->name), "%s", name);
    u->age = age;
    return u;
}
int main() {
    User* ${randVar()} = create_user("Alice", ${randNum()});
    printf("%s: %d\\n", ${randVar()}->name, ${randVar()}->age);
    free(${randVar()});
    return 0;
}`
    ],
    diamond: [
      () => `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
typedef struct Node {
    int data;
    struct Node* next;
} Node;
typedef struct {
    Node* head;
    int size;
} LinkedList;
LinkedList* list_create() {
    LinkedList* list = malloc(sizeof(LinkedList));
    list->head = NULL;
    list->size = 0;
    return list;
}
void list_push(LinkedList* list, int data) {
    Node* node = malloc(sizeof(Node));
    node->data = data;
    node->next = list->head;
    list->head = node;
    list->size++;
}
int list_pop(LinkedList* list) {
    if (list->head == NULL) return -1;
    Node* temp = list->head;
    int data = temp->data;
    list->head = temp->next;
    free(temp);
    list->size--;
    return data;
}
int list_get(LinkedList* list, int index) {
    Node* current = list->head;
    int i = 0;
    while (current != NULL && i < index) {
        current = current->next;
        i++;
    }
    return current ? current->data : -1;
}
void list_free(LinkedList* list) {
    Node* current = list->head;
    while (current != NULL) {
        Node* next = current->next;
        free(current);
        current = next;
    }
    free(list);
}
void list_print(LinkedList* list) {
    Node* current = list->head;
    while (current != NULL) {
        printf("%d ", current->data);
        current = current->next;
    }
    printf("\\n");
}
int main() {
    LinkedList* ${randVar()} = list_create();
    list_push(${randVar()}, ${randNum()});
    list_push(${randVar()}, ${randNum()});
    list_push(${randVar()}, ${randNum()});
    list_print(${randVar()});
    printf("Size: %d\\n", ${randVar()}->size);
    printf("Pop: %d\\n", list_pop(${randVar()}));
    list_free(${randVar()});
    return 0;
}`
    ],
    african: [
      () => `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define MAX_SIZE 100
typedef struct {
    char key[32];
    int value;
} Entry;
typedef struct {
    Entry entries[MAX_SIZE];
    int size;
} HashMap;
typedef struct {
    char action[16];
    char key[32];
    int old_value;
    int new_value;
} HistoryEntry;
typedef struct {
    HistoryEntry entries[MAX_SIZE * 2];
    int count;
} History;
void hashmap_init(HashMap* map) {
    map->size = 0;
}
int hashmap_find(HashMap* map, const char* key) {
    for (int i = 0; i < map->size; i++) {
        if (strcmp(map->entries[i].key, key) == 0) {
            return i;
        }
    }
    return -1;
}
void hashmap_set(HashMap* map, const char* key, int value, History* hist) {
    int idx = hashmap_find(map, key);
    if (idx >= 0) {
        strcpy(hist->entries[hist->count].action, "update");
        strcpy(hist->entries[hist->count].key, key);
        hist->entries[hist->count].old_value = map->entries[idx].value;
        hist->entries[hist->count].new_value = value;
        hist->count++;
        map->entries[idx].value = value;
    } else {
        strcpy(hist->entries[hist->count].action, "add");
        strcpy(hist->entries[hist->count].key, key);
        hist->entries[hist->count].old_value = 0;
        hist->entries[hist->count].new_value = value;
        hist->count++;
        strcpy(map->entries[map->size].key, key);
        map->entries[map->size].value = value;
        map->size++;
    }
}
int hashmap_get(HashMap* map, const char* key, int default_value) {
    int idx = hashmap_find(map, key);
    return idx >= 0 ? map->entries[idx].value : default_value;
}
int hashmap_remove(HashMap* map, const char* key) {
    int idx = hashmap_find(map, key);
    if (idx < 0) return 0;
    for (int i = idx; i < map->size - 1; i++) {
        map->entries[i] = map->entries[i + 1];
    }
    map->size--;
    return 1;
}
void hashmap_print(HashMap* map) {
    printf("Map (%d entries):\\n", map->size);
    for (int i = 0; i < map->size; i++) {
        printf("  %s = %d\\n", map->entries[i].key, map->entries[i].value);
    }
}
void history_print(History* hist, int n) {
    int start = hist->count > n ? hist->count - n : 0;
    printf("History (last %d):\\n", hist->count - start);
    for (int i = start; i < hist->count; i++) {
        printf("  [%s] %s: %d -> %d\\n",
            hist->entries[i].action,
            hist->entries[i].key,
            hist->entries[i].old_value,
            hist->entries[i].new_value);
    }
}
int main() {
    HashMap ${randVar()};
    History ${randVar()}_hist;
    ${randVar()}.size = 0;
    ${randVar()}_hist.count = 0;
    hashmap_set(&${randVar()}, "alpha", ${randNum()}, &${randVar()}_hist);
    hashmap_set(&${randVar()}, "beta", ${randNum()}, &${randVar()}_hist);
    hashmap_set(&${randVar()}, "alpha", ${randNum()}, &${randVar()}_hist);
    hashmap_print(&${randVar()});
    history_print(&${randVar()}_hist, 10);
    printf("alpha = %d\\n", hashmap_get(&${randVar()}, "alpha", 0));
    return 0;
}`
    ]
  }
  return rand(templates[difficulty])()
}

// ==================== Go 代码模板 ====================

function genGo(difficulty: Difficulty): string {
  const templates: Record<Difficulty, (() => string)[]> = {
    iron: [
      () => `package main
import "fmt"
func main() {
    ${randVar()} := ${randNum()}
    if ${randVar()} > 50 {
        fmt.Println(${randVar()})
    } else {
        fmt.Println("low")
    }
}`,
      () => {
        const fnName = randFunc()
        return `package main
import "fmt"
func ${fnName}(a, b int) int {
    return a + b
}
func main() {
    ${randVar()} := ${fnName}(${randNum()}, ${randNum()})
    fmt.Println(${randVar()})
}`
      }
    ],
    stone: [
      () => {
        const fnName = randFunc()
        return `package main
import "fmt"
func ${fnName}(items []int) int {
    ${randVar()} := 0
    for _, n := range items {
        if n > ${randNum()} {
            ${randVar()} += n
        }
    }
    return ${randVar()}
}
func main() {
    ${randVar()} := []int{${randNum()}, ${randNum()}, ${randNum()}, ${randNum()}}
    ${randVar()} := ${fnName}(${randVar()})
    fmt.Println("Result:", ${randVar()})
}`
      },
      () => {
        const className = randClass()
        const countMethod = randMethod().toLowerCase()
        return `package main
import "fmt"
type ${className} struct {
    name string
    data []int
}
func (s *${className}) Add(item int) {
    s.data = append(s.data, item)
}
func (s *${className}) ${countMethod}() int {
    return len(s.data)
}
func main() {
    ${randVar()} := &${className}{name: "test"}
    ${randVar()}.Add(${randNum()})
    ${randVar()}.Add(${randNum()})
    fmt.Println(${randVar()}.${countMethod}())
}`
      }
    ],
    diamond: [
      () => {
        const className = randClass()
        const filterMethod = randMethod().toLowerCase()
        return `package main
import (
    "fmt"
    "sort"
)
type User struct {
    ID   int
    Name string
    Age  int
}
type ${className} struct {
    users []User
}
func (s *${className}) Add(u User) bool {
    if u.ID <= 0 || u.Name == "" {
        return false
    }
    s.users = append(s.users, u)
    return true
}
func (s *${className}) FindByMinAge(minAge int) []User {
    var result []User
    for _, u := range s.users {
        if u.Age >= minAge {
            result = append(result, u)
        }
    }
    return result
}
func (s *${className}) SortByName() {
    sort.Slice(s.users, func(i, j int) bool {
        return s.users[i].Name < s.users[j].Name
    })
}
func (s *${className}) ${filterMethod}(fn func(User) bool) []User {
    var result []User
    for _, u := range s.users {
        if fn(u) {
            result = append(result, u)
        }
    }
    return result
}
func (s *${className}) Size() int {
    return len(s.users)
}
func main() {
    ${randVar()} := &${className}{}
    ${randVar()}.Add(User{ID: 1, Name: "Alice", Age: ${randNum()}})
    ${randVar()}.Add(User{ID: 2, Name: "Bob", Age: ${randNum()}})
    ${randVar()}.Add(User{ID: 3, Name: "Charlie", Age: ${randNum()}})
    ${randVar()}.SortByName()
    ${randVar()} := ${randVar()}.${filterMethod}(func(u User) bool {
        return u.Age > ${randNum()}
    })
    fmt.Println("All:", ${randVar()}.Size())
    fmt.Println("Filtered:", len(${randVar()}))
}`
      }
    ],
    african: [
      () => {
        const className = randClass()
        return `package main
import (
    "errors"
    "fmt"
    "sync"
)
type Result struct {
    Success bool
    Data    interface{}
    Error   error
}
func success(data interface{}) Result {
    return Result{Success: true, Data: data}
}
func failure(err error) Result {
    return Result{Success: false, Error: err}
}
type ${className}[T any] struct {
    mu          sync.RWMutex
    data        map[string]T
    middleware  []func(string, T, *T) T
    subscribers []func(string, T, *T)
    history     []string
}
func New${className}[T any]() *${className}[T] {
    return &${className}[T]{
        data: make(map[string]T),
    }
}
func (s *${className}[T]) Use(mw func(string, T, *T) T) *${className}[T] {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.middleware = append(s.middleware, mw)
    return s
}
func (s *${className}[T]) Subscribe(fn func(string, T, *T)) func() {
    s.mu.Lock()
    defer s.mu.Unlock()
    idx := len(s.subscribers)
    s.subscribers = append(s.subscribers, fn)
    return func() {
        s.mu.Lock()
        defer s.mu.Unlock()
        s.subscribers = append(s.subscribers[:idx], s.subscribers[idx+1:]...)
    }
}
func (s *${className}[T]) Set(key string, value T) {
    s.mu.Lock()
    var oldValue *T
    if v, ok := s.data[key]; ok {
        oldValue = &v
    }
    newValue := value
    for _, mw := range s.middleware {
        newValue = mw(key, newValue, oldValue)
    }
    s.data[key] = newValue
    s.history = append(s.history, key)
    subs := make([]func(string, T, *T), len(s.subscribers))
    copy(subs, s.subscribers)
    s.mu.Unlock()
    for _, fn := range subs {
        fn(key, newValue, oldValue)
    }
}
func (s *${className}[T]) Get(key string) (T, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    v, ok := s.data[key]
    return v, ok
}
func (s *${className}[T]) Delete(key string) bool {
    s.mu.Lock()
    defer s.mu.Unlock()
    if _, ok := s.data[key]; !ok {
        return false
    }
    delete(s.data, key)
    return true
}
func (s *${className}[T]) Filter(pred func(string, T) bool) map[string]T {
    s.mu.RLock()
    defer s.mu.RUnlock()
    result := make(map[string]T)
    for k, v := range s.data {
        if pred(k, v) {
            result[k] = v
        }
    }
    return result
}
func (s *${className}[T]) Keys() []string {
    s.mu.RLock()
    defer s.mu.RUnlock()
    keys := make([]string, 0, len(s.data))
    for k := range s.data {
        keys = append(keys, k)
    }
    return keys
}
func (s *${className}[T]) Stats() map[string]int {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return map[string]int{
        "data":        len(s.data),
        "history":     len(s.history),
        "subscribers": len(s.subscribers),
        "middleware":  len(s.middleware),
    }
}
func main() {
    ${randVar()} := New${className}[int]()
    ${randVar()}.Use(func(key string, val int, old *int) int {
        return val * 2
    })
    unsub := ${randVar()}.Subscribe(func(key string, val int, old *int) {
        fmt.Printf("Changed %s to %d\\n", key, val)
    })
    ${randVar()}.Set("count", ${randNum()})
    ${randVar()}.Set("score", ${randNum()})
    unsub()
    ${randVar()}.Set("count", ${randNum()})
    ${randVar()} := ${randVar()}.Filter(func(k string, v int) bool {
        return v > ${randNum()}
    })
    fmt.Println("Filtered:", ${randVar()})
    fmt.Println("Stats:", ${randVar()}.Stats())
}`
      }
    ]
  }
  return rand(templates[difficulty])()
}

// ==================== Rust 代码模板 ====================

function genRust(difficulty: Difficulty): string {
  const templates: Record<Difficulty, (() => string)[]> = {
    iron: [
      () => `fn main() {
    let ${randVar()} = ${randNum()};
    if ${randVar()} > 50 {
        println!("{}", ${randVar()});
    } else {
        println!("low");
    }
}`,
      () => {
        const fnName = randFunc()
        return `fn ${fnName}(a: i32, b: i32) -> i32 {
    a + b
}
fn main() {
    let ${randVar()} = ${fnName}(${randNum()}, ${randNum()});
    println!("{}", ${randVar()});
}`
      }
    ],
    stone: [
      () => {
        const fnName = randFunc()
        return `fn ${fnName}(items: &[i32]) -> i32 {
    let mut ${randVar()} = 0;
    for &n in items {
        if n > ${randNum()} {
            ${randVar()} += n;
        }
    }
    ${randVar()}
}
fn main() {
    let ${randVar()} = [${randNum()}, ${randNum()}, ${randNum()}, ${randNum()}];
    let ${randVar()} = ${fnName}(&${randVar()});
    println!("Result: {}", ${randVar()});
}`
      },
      () => {
        const className = randClass()
        const countMethod = randMethod().toLowerCase()
        return `struct ${className} {
    name: String,
    data: Vec<i32>,
}
impl ${className} {
    fn new(name: &str) -> Self {
        ${className} {
            name: name.to_string(),
            data: Vec::new(),
        }
    }
    fn add(&mut self, item: i32) {
        self.data.push(item);
    }
    fn ${countMethod}(&self) -> usize {
        self.data.len()
    }
}
fn main() {
    let mut ${randVar()} = ${className}::new("test");
    ${randVar()}.add(${randNum()});
    ${randVar()}.add(${randNum()});
    println!("{}", ${randVar()}.${countMethod}());
}`
      }
    ],
    diamond: [
      () => {
        const traitName = randClass()
        const filterMethod = randMethod().toLowerCase()
        const statsMethod = randMethod().toLowerCase()
        return `use std::collections::HashMap;
trait ${traitName} {
    type Item;
    fn validate(&self, item: &Self::Item) -> bool;
    fn add(&mut self, item: Self::Item) -> bool;
    fn get_all(&self) -> Vec<&Self::Item>;
}
struct User {
    id: i32,
    name: String,
    age: i32,
}
struct UserStore {
    users: Vec<User>,
    history: Vec<String>,
}
impl ${traitName} for UserStore {
    type Item = User;
    fn validate(&self, item: &User) -> bool {
        item.id > 0 && !item.name.is_empty()
    }
    fn add(&mut self, item: User) -> bool {
        if !self.validate(&item) {
            return false;
        }
        self.history.push(format!("add: {}", item.name));
        self.users.push(item);
        true
    }
    fn get_all(&self) -> Vec<&User> {
        self.users.iter().collect()
    }
}
impl UserStore {
    fn new() -> Self {
        UserStore {
            users: Vec::new(),
            history: Vec::new(),
        }
    }
    fn find_by_min_age(&self, min_age: i32) -> Vec<&User> {
        self.users.iter().filter(|u| u.age >= min_age).collect()
    }
    fn ${filterMethod}<F>(&self, pred: F) -> Vec<&User>
    where
        F: Fn(&User) -> bool,
    {
        self.users.iter().filter(|u| pred(u)).collect()
    }
    fn ${statsMethod}(&self) -> HashMap<String, usize> {
        let mut stats = HashMap::new();
        stats.insert("users".to_string(), self.users.len());
        stats.insert("history".to_string(), self.history.len());
        stats
    }
}
fn main() {
    let mut ${randVar()} = UserStore::new();
    ${randVar()}.add(User { id: 1, name: "Alice".to_string(), age: ${randNum()} });
    ${randVar()}.add(User { id: 2, name: "Bob".to_string(), age: ${randNum()} });
    let ${randVar()} = ${randVar()}.find_by_min_age(${randNum()});
    println!("Found: {}", ${randVar()}.len());
    println!("Stats: {:?}", ${randVar()}.${statsMethod}());
}`
      }
    ],
    african: [
      () => {
        const structName = randClass()
        return `use std::collections::HashMap;
use std::sync::{Arc, RwLock};
type Middleware<T> = Box<dyn Fn(&str, T, Option<&T>) -> T + Send + Sync>;
type Subscriber<T> = Box<dyn Fn(&str, T, Option<&T>) + Send + Sync>;
struct ${structName}<T: Clone + Send + Sync + 'static> {
    state: Arc<RwLock<HashMap<String, T>>>,
    middleware: Arc<RwLock<Vec<Middleware<T>>>>,
    subscribers: Arc<RwLock<Vec<Subscriber<T>>>>,
    history: Arc<RwLock<Vec<String>>>,
}
impl<T: Clone + Send + Sync + 'static> ${structName}<T> {
    fn new() -> Self {
        ${structName} {
            state: Arc::new(RwLock::new(HashMap::new())),
            middleware: Arc::new(RwLock::new(Vec::new())),
            subscribers: Arc::new(RwLock::new(Vec::new())),
            history: Arc::new(RwLock::new(Vec::new())),
        }
    }
    fn use_middleware<F>(&self, mw: F) -> &Self
    where
        F: Fn(&str, T, Option<&T>) -> T + Send + Sync + 'static,
    {
        self.middleware.write().unwrap().push(Box::new(mw));
        self
    }
    fn subscribe<F>(&self, fn_sub: F) -> impl Fn()
    where
        F: Fn(&str, T, Option<&T>) + Send + Sync + 'static,
    {
        self.subscribers.write().unwrap().push(Box::new(fn_sub));
        let subs = Arc::clone(&self.subscribers);
        move || {
            let mut s = subs.write().unwrap();
            if !s.is_empty() {
                s.pop();
            }
        }
    }
    fn set(&self, key: &str, value: T) {
        let old_value = {
            let state = self.state.read().unwrap();
            state.get(key).cloned()
        };
        let mut new_value = value;
        {
            let mw = self.middleware.read().unwrap();
            for m in mw.iter() {
                new_value = m(key, new_value, old_value.as_ref());
            }
        }
        {
            let mut state = self.state.write().unwrap();
            state.insert(key.to_string(), new_value.clone());
            let mut hist = self.history.write().unwrap();
            hist.push(key.to_string());
        }
        let subs = self.subscribers.read().unwrap();
        for s in subs.iter() {
            s(key, new_value.clone(), old_value.as_ref());
        }
    }
    fn get(&self, key: &str) -> Option<T> {
        let state = self.state.read().unwrap();
        state.get(key).cloned()
    }
    fn delete(&self, key: &str) -> bool {
        let mut state = self.state.write().unwrap();
        state.remove(key).is_some()
    }
    fn filter<F>(&self, pred: F) -> Vec<(String, T)>
    where
        F: Fn(&str, &T) -> bool,
    {
        let state = self.state.read().unwrap();
        state.iter()
            .filter(|(k, v)| pred(k, v))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect()
    }
    fn keys(&self) -> Vec<String> {
        let state = self.state.read().unwrap();
        state.keys().cloned().collect()
    }
    fn stats(&self) -> HashMap<String, usize> {
        let mut stats = HashMap::new();
        stats.insert("state".to_string(), self.state.read().unwrap().len());
        stats.insert("history".to_string(), self.history.read().unwrap().len());
        stats.insert("subscribers".to_string(), self.subscribers.read().unwrap().len());
        stats.insert("middleware".to_string(), self.middleware.read().unwrap().len());
        stats
    }
}
fn main() {
    let ${randVar()} = ${structName}::<i32>::new();
    ${randVar()}.use_middleware(|_key, val, _old| val * 2);
    let unsub = ${randVar()}.subscribe(|key, val, _old| {
        println!("Changed {} to {}", key, val);
    });
    ${randVar()}.set("count", ${randNum()});
    ${randVar()}.set("score", ${randNum()});
    unsub();
    ${randVar()}.set("count", ${randNum()});
    let ${randVar()} = ${randVar()}.filter(|_k, v| *v > ${randNum()});
    println!("Filtered: {:?}", ${randVar()});
    println!("Stats: {:?}", ${randVar()}.stats());
}`
      }
    ]
  }
  return rand(templates[difficulty])()
}

// ==================== 主生成函数 ====================

export function generateCode(language: PracticeLanguage, difficulty: Difficulty): string {
  const generators: Record<PracticeLanguage, (d: Difficulty) => string> = {
    javascript: genJavaScript,
    typescript: genTypeScript,
    python: genPython,
    java: genJava,
    cpp: genCpp,
    c: genC,
    go: genGo,
    rust: genRust
  }

  const generator = generators[language]
  return generator(difficulty)
}
