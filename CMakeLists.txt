cmake_minimum_required(VERSION 3.14)
project(webjson LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)

include(FetchContent)

FetchContent_Declare(
  nlohmann_json
  GIT_REPOSITORY https://github.com/nlohmann/json.git
  GIT_TAG v3.11.2
)
FetchContent_MakeAvailable(nlohmann_json)

FetchContent_Declare(
  cpp_httplib
  GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
  GIT_TAG v0.10.5
)
FetchContent_GetProperties(cpp_httplib)
if (NOT cpp_httplib_POPULATED)
  FetchContent_Populate(cpp_httplib)
endif()
if (NOT cpp_httplib_SOURCE_DIR)
  set(cpp_httplib_SOURCE_DIR "${CMAKE_BINARY_DIR}/_deps/cpp_httplib-src")
endif()

add_executable(webjson src/main.cpp)
target_include_directories(webjson PRIVATE ${cpp_httplib_SOURCE_DIR})
target_link_libraries(webjson PRIVATE nlohmann_json::nlohmann_json)

find_package(Threads REQUIRED)
target_link_libraries(webjson PRIVATE Threads::Threads)

if (UNIX)
  target_compile_options(webjson PRIVATE -Wall -Wextra -Wpedantic)
endif()
