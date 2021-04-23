;;compile with wat2wasm hello.1.wat --enable-threads --out /dev/stdout | base64 --wrap 0

(module
  (import "env" "memory" (memory 1))
  (import "env" "log" (func $log (param i32 i32)))

  (data (i32.const 0) "Hello, World!")

  (func (export "hello")
    i32.const 0
    i32.const 13
    call $log
  )
)