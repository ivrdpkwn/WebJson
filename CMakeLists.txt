cmake_minimum_required(VERSION 3.14)
project(webjson LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)

find_package(Threads REQUIRED)

include_directories(include)

add_executable(webjson src/main.cpp)
target_link_libraries(webjson PRIVATE Threads::Threads)

if (UNIX)
  target_compile_options(webjson PRIVATE -Wall -Wextra -Wpedantic)
endif()
